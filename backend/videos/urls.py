from django.urls import path
from .views import video_list, extract_frame

urlpatterns = [
    path('videos/', video_list),
    path('videos/extract/', extract_frame),
]