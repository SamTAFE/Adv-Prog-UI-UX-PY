from pathlib import Path
from rest_framework.response import Response
from rest_framework.decorators import api_view
from moviepy import VideoFileClip
import cv2
import base64
import pytesseract

def is_integer(val):
    try:
        int(val)
        return True
    except ValueError:
        return False

@api_view(['GET'])
def video_list(request):
    dir = Path.cwd()
    data = Path(dir).joinpath('data')

    filenames = [f.name for f in data.iterdir() if f.is_file() ]
    files = []

    for filename in filenames:
        with VideoFileClip(data.joinpath(filename)) as video:
            files.append({
                'name': filename,
                'duration': video.duration,
            })

    return Response({ 'videos': files })

@api_view(['GET'])
def extract_frame(request):

    filename = request.GET.get('file')
    if filename is None:
        return Response({ 'error_code': 0, 'error_message': 'no file provided' })

    timestamp = request.GET.get('timestamp')
    if timestamp is None:
        return Response({ 'error_code': 1, 'error_message': 'no timestamp provided' })

    parts = timestamp.split(':')

    if len(parts) > 2 or not is_integer(parts[0]) or (len(parts) == 2 and not is_integer(parts[1])):
        return Response({ 'error_code': 2, 'error_message': 'invalid timestamp provided' })

    time = (int(parts[0]) * 60) + int(len(parts) == 2 and parts[1] or 0)
    if len(parts) == 1:
        time = time / 60

    dir = Path.cwd()
    data = Path(dir).joinpath('data').joinpath(filename)

    if not data.is_file():
        return Response({ 'error_code': 3, 'error_message': 'invalid file provided' })

    with VideoFileClip(data) as video:
        if time > video.duration:
            return Response({ 'error_code': 4, 'error_message': 'timestamp exceeds duration' })

    cap = cv2.VideoCapture(str(data))
    cap.set(cv2.CAP_PROP_POS_MSEC, time * 1000)

    success, frame = cap.read()
    if not success:
        return Response({ 'error_code': 5, 'error_message': 'failed to extract frame' })

    success, buffer = cv2.imencode('.jpg', frame)
    if not success:
        return Response({ 'error_code': 5, 'error_message': 'failed to extract frame' })

    text = pytesseract.image_to_string(frame)
    b64 = base64.b64encode(buffer).decode('utf-8')
    return Response({
        'frame': b64,
        'text': text
    })