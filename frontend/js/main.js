document.addEventListener('DOMContentLoaded', async () => {

    const response = await fetch('http://localhost:8000/api/videos/', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    const json = await response.json();
    const select = document.getElementById('video');

    const videos = {};
    for (const video of json.videos) {
        const option = document.createElement('option');
        option.innerText = video.name;
        option.value = video.name;

        videos[video.name] = video.duration;
        select.appendChild(option);
    }

    const timestamp = document.getElementById('timestamp');

    const extract = document.getElementById('extract-frame');
    const extractClass = /* tw */ 'duration-200 hover:-translate-y-0.5 active:scale-90 bg-red-500 border border-red-700 rounded-md px-2 py-1 text-white font-bold text-base';
    const disabledExtractClass = /* tw */ 'duration-200 bg-red-700 border border-red-800 rounded-md px-2 py-1 text-zinc-100 font-bold text-base';

    const onChange = () => {
        const val = timestamp.value;

        if (val == '') {
            timestampError.innerHTML = '';
            extract.className = disabledExtractClass;
            extract.disabled = true;
            return;
        }

        if (!regex.test(val)) {
            timestampError.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
                    Invalid timestamp format, must be mm:ss
            `;

            extract.className = disabledExtractClass;
            extract.disabled = true;
            return;
        }

        let time = 0;
        if (val.includes(':')) {
            parts = val.split(':');
            time = (parseInt(parts[0]) * 60) + parseInt(parts[1]);
        } else time = parseInt(val);

        const duration = videos[select.value];
        if (time > duration) {
            timestampError.innerHTML = `
            <i class="fa-solid fa-triangle-exclamation"></i>
                    Invalid timestamp, must be within video length
            `;

            extract.className = disabledExtractClass;
            extract.disabled = true;
            return;
        }

        if (select.value == '') {
            timestampError.innerHTML = '';
            extract.className = disabledExtractClass;
            extract.disabled = true;
            return;
        }

        extract.className = extractClass;
        timestampError.innerHTML = '';
        extract.disabled = false;
    }

    const maxDuration = document.getElementById('max-duration');
    select.addEventListener('change', () => {
        onChange();
        if (select.value == '') return;

        const duration = videos[select.value];

        const mins = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);

        maxDuration.innerText = `Max ${mins}:${seconds}`
    });

    const timestampError = document.getElementById('timestamp-error');
    const regex = /^\d+(?::\d+)?$/;

    timestamp.addEventListener('change', onChange);

    extract.disabled = true;
    // const structured = document.getElementById('structured');
    const unstructured = document.getElementById('unstructured');

    const frame = document.getElementById('frame');
    const extracted = document.getElementById('extracted');

    const copy = document.getElementById('copy-code');

    extract.addEventListener('click', async () => {
        const file = select.value;
        const time = timestamp.value;

        if (file == '' || time == '' || !regex.test(time)) return;

        const response1 = await fetch(`http://localhost:8000/api/videos/extract?file=${file}&timestamp=${time}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        const json1 = await response1.json();

        let text = json1.text;

        if (unstructured.checked) {
            text = text.replaceAll('\n', ' ');
        }

        copy.className = extractClass;
        frame.src = `data:image/png;base64,${json1.frame}`;
        extracted.innerText = text;
    });

    copy.addEventListener('click', () => {
       navigator.clipboard.writeText(extracted.innerText);
    });

    window.addEventListener('keydown', (event) => {
        if (!event.metaKey && !event.ctrlKey) return;

        if (event.key == 'c') {
            event.preventDefault();
            navigator.clipboard.writeText(extracted.innerText);
        }

        if (event.key == 'e') extract.click();
    });

    const shortcuts = document.getElementById('shortcuts');
    const overlay = document.getElementById('overlay');
    const close = document.getElementById('close');

    shortcuts.addEventListener('click', () => {
        overlay.classList.remove('hidden');
    });

    close.addEventListener('click', () => {
        overlay.classList.add('hidden');
    });
});