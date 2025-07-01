/* Reference nodes */
const desktop=document.getElementById('desktop');
const deskMenu=document.getElementById('desktop-menu');
const dmRefresh=document.getElementById('dm-refresh');
const dmNewFile=document.getElementById('dm-newfile');
// const searchInput=document.getElementById('search-input');
// const braveIcon=document.getElementById('brave-icon');


/* ---------- Cached DOM refs ---------- */
// const desktop = document.getElementById('desktop');
const newFileBtn = document.getElementById('new-file-btn');
const contextMenu = document.getElementById('context-menu');
const newFileOpt = document.getElementById('newfile-option');
const renameOpt = document.getElementById('rename-option');
const deleteOpt = document.getElementById('delete-option');
const recycleBin = document.getElementById('recycle-bin');
const recycleList = document.getElementById('recycle-list');
const taskItems = document.getElementById('task-items');
const searchInput = document.getElementById('search-input');
const braveIcon = document.getElementById('brave-icon');
const wifiTrayIcon = document.getElementById('wifi-icon');
const dtElem = document.getElementById('datetime');
const startBtn = document.getElementById('start-btn');
const startMenu = document.getElementById('start-menu');
const quickPanel = document.getElementById('quick-panel');

// for player
const songs = [
    { title: "Aaj ki Raat", file: "./assets/Aaj Ki Raat.mp3" },
    { title: "Bheegi Bheegi Raaton mein", file: "./assets/Bheegi Bheegi Raaton Mein.mp3" },
    { title: "Uyi Amma", file: "./assets/UyiAmma.mp3" }
];

const audio = document.getElementById('audio');
const title = document.getElementById('title');
const playBtn = document.getElementById('play');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const playlist = document.getElementById('playlist');

let currentSongIndex = 0;


/* ---------- Loader animation ---------- */
let tl = gsap.timeline()
tl.to("#loader", {
    duration: 11,
})
tl.to('#loader', {
    opacity: 0,
    display: "none"
})
tl.from('#desktop', {
    y: 1200,
})



/* Quick‑panel buttons & sliders */
const qp = {
    wifi: document.getElementById('qp-wifi'),
    bt: document.getElementById('qp-bt'),
    air: document.getElementById('qp-air'),
    power: document.getElementById('qp-power'),
    night: document.getElementById('qp-night'),
    bright: document.getElementById('qp-bright'),
    vol: document.getElementById('qp-vol'),
    batt: document.getElementById('battery-level'),
    setBtn: document.getElementById('settings-btn')
};

/* ---------- Global state ---------- */
let fileCount = 0;                 // number of desktop files
let rightClickedFile = null;       // {file, fname}
let deletedFiles = [];           // recycle‑bin entries
const myPcItems = [];           // captured media {type, name, src}
const quickState = {             // quick‑settings
    wifi: true, bt: true, air: false, power: false, night: false,
    brightness: 100, volume: 80, battery: 76
};

/* ---------- Utility: persistence of desktop icons ---------- */
function saveDesktopState() {
    const data = [...desktop.querySelectorAll('.file.standard')].map(f => ({
        name: f.querySelector('.filename').textContent,
        left: parseInt(f.style.left), top: parseInt(f.style.top)
    }));
    localStorage.setItem('desktopFiles', JSON.stringify(data));
    localStorage.setItem('deletedFiles', JSON.stringify(deletedFiles));
}
function loadDesktopState() {
    const files = JSON.parse(localStorage.getItem('desktopFiles') || '[]');
    files.forEach(f => createFile(f.name, f.left, f.top, false));
    deletedFiles = JSON.parse(localStorage.getItem('deletedFiles') || '[]');
    updateRecycleBin();
}

/* ---------- Desktop file CRUD ---------- */
function createFile(name = `New File ${fileCount + 1}`, left = null, top = null, updateSave = true) {
    const file = document.createElement('div');
    file.className = 'file standard';
    file.style.left = left !== null ? left + 'px' : 100 + (fileCount % 5) * 90 + 'px';
    file.style.top = top !== null ? top + 'px' : 100 + Math.floor(fileCount / 5) * 100 + 'px';

    file.innerHTML = `
      <img src="https://cdn-icons-png.flaticon.com/512/716/716784.png">
      <div class="filename">${name}</div>`;
    desktop.appendChild(file);
    makeFileFunctional(file, file.querySelector('.filename'));
    fileCount++;
    if (updateSave) saveDesktopState();
}
function makeFileFunctional(file, fname) {
    /* drag‑move */
    let drag = false, offX = 0, offY = 0;
    file.addEventListener('mousedown', e => {
        if (e.target === fname && fname.isContentEditable) return;
        drag = true; offX = e.offsetX; offY = e.offsetY; file.style.zIndex = Date.now();
    });
    document.addEventListener('mousemove', e => {
        if (drag) { file.style.left = e.pageX - offX + 'px'; file.style.top = e.pageY - offY + 'px'; }
    });
    document.addEventListener('mouseup', () => { if (drag) saveDesktopState(); drag = false; });

    /* open window */
    file.ondblclick = () => openWindow(fname.textContent);

    /* context‑menu */
    file.oncontextmenu = e => {
        e.preventDefault();
        rightClickedFile = { file, fname };
        contextMenu.style.top = e.pageY + 'px';
        contextMenu.style.left = e.pageX + 'px';
        contextMenu.style.display = 'block';
    };

    /* rename blur */
    fname.onblur = () => { fname.contentEditable = false; saveDesktopState(); };

    /* F2 shortcut */
    document.addEventListener('keydown', e => {
        if (e.key === 'F2' && rightClickedFile?.file === file) {
            fname.contentEditable = true; fname.focus();
        }
    });
}

/* ---------- Special desktop icon: My PC ---------- */
function createMyPC() {
    const file = document.createElement('div');
    file.className = 'file';
    file.style.left = '12px'; file.style.top = '12px';
    file.innerHTML = `
      <img src="./assets/my-pc.png">
      <div class="filename">My PC</div>`;
    desktop.appendChild(file);
    file.ondblclick = openMyPCWindow;
}
function openMyPCWindow() {
    const body = document.createElement('div');
    refreshMyPC(body);
    openWindow('My PC', body);
}
function refreshMyPC(container) {
    container.innerHTML = '';
    if (!myPcItems.length) {
        container.innerHTML = '<p style="color:#666">No media captured yet.</p>'; return;
    }
    myPcItems.forEach(item => {
        if (item.type === 'image') {
            const img = new Image(); img.src = item.src; img.width = 100; img.style.margin = '4px';
            container.appendChild(img);
        } else {
            const vid = document.createElement('video'); vid.src = item.src;
            vid.controls = true; vid.width = 120; vid.style.margin = '4px';
            container.appendChild(vid);
        }
    });
}

/* ---------- Window manager ---------- */
function addTaskItem(win, title) {
    const t = document.createElement('div');
    t.className = 'taskbar-item'; t.textContent = title; t.dataset.id = win.dataset.id;
    taskItems.appendChild(t);
    t.onclick = () => { if (win.style.display === 'none') win.style.display = 'block'; focus(win); };
}
function focus(win) { win.style.display = 'block'; win.style.zIndex = Date.now(); }
function openWindow(title, bodyContent = '') {
    const win = document.createElement('div');
    win.className = 'window'; win.dataset.id = 'w' + Date.now();
    win.style.top = 120 + Math.random() * 80 + 'px';
    win.style.left = 200 + Math.random() * 80 + 'px';

    win.innerHTML = `
   <div class="window-header">
     <span class="title">${title}</span>
     <div>
       <span class="header-btn min-btn">➖</span>
       <span class="header-btn max-btn">⏹️</span>
       <span class="header-btn close-btn">❌</span>
     </div>
   </div>
   <div class="window-body"></div>`;
    desktop.appendChild(win);
    const body = win.querySelector('.window-body');
    typeof bodyContent === 'string' ? body.innerHTML = bodyContent : body.appendChild(bodyContent);

    // resize window


    /* drag window */
    const header = win.querySelector('.window-header');
    let drag = false, ox = 0, oy = 0;
    header.onmousedown = e => {
        if (e.target.classList.contains('header-btn')) return;
        drag = true; ox = e.offsetX; oy = e.offsetY; focus(win);
    };
    document.onmousemove = e => { if (drag) { win.style.left = e.pageX - ox + 'px'; win.style.top = e.pageY - oy + 'px'; } };
    document.onmouseup = () => drag = false;

    /* window buttons */
    win.querySelector('.min-btn').onclick = () => win.style.display = 'none';
    win.querySelector('.close-btn').onclick = () => {
        desktop.removeChild(win);
        taskItems.querySelector(`[data-id="${win.dataset.id}"]`)?.remove();
    };
    const maxBtn = win.querySelector('.max-btn');
    let maximised = false, prev = {};
    maxBtn.onclick = () => {
        if (!maximised) {
            prev = { t: win.style.top, l: win.style.left, w: win.style.width, h: win.style.height };
            win.style.top = '0'; win.style.left = '0';
            win.style.width = '100%'; win.style.height = 'calc(100% - 40px)';
            maximised = true;
        } else {
            win.style.top = prev.t; win.style.left = prev.l;
            win.style.width = prev.w || ''; win.style.height = prev.h || '';
            maximised = false;
        }
        focus(win);
    };
    addTaskItem(win, title); focus(win); return win;
}

/* ---------- Apps ---------- */
/* ----------- real openBrave ------------ */
function openBrave(q = '') {
  const makeUrl = txt =>
    'https://' + encodeURIComponent(txt);

  const body = `
    <div style="display:flex;gap:6px;margin-bottom:6px">
      <input class="addr" style="flex:1;padding:4px 8px"
             value="${q.replace(/\"/g,'&quot;')}" />
      <button class="go">Go</button>
    </div>
    <iframe class="view" src="${q ? makeUrl(q) : ''}"
            style="width:100%;height:calc(100% - 40px);border:none"></iframe>`;

  const win = openWindow('Brave Browser', body);      // ← your window‑manager helper
  const addr  = win.querySelector('.addr');
  const goBtn = win.querySelector('.go');
  const view  = win.querySelector('.view');

  const navigate = () => (view.src = makeUrl(addr.value));
  goBtn.onclick = navigate;
  addr.onkeydown = e => e.key === 'Enter' && navigate();
}
function openNotepad() {
    openWindow('Notepad',
        `<textarea style="width:100%;height:100%;border:none;resize:none;
                     font-family:monospace;font-size:14px;
                     padding:8px;box-sizing:border-box"></textarea>`);
}
function openVSCode() {
    openWindow('VS Code',
        `<div style="display:flex;justify-content:center;align-items:center;height:100%;
                color:#555;font-family:monospace;font-size:18px">
       Aaa gaye fir muh utha kar<br>
     </div>`);
}
function openTerminal() {
    openWindow('Termianl',
        `<textarea style="width:100%;height:100%;border:none;resize:none;
            font-family:monospace;font-size:14px;
            padding:8px;box-sizing:border-box" placeholder="kya kar raha he bhai mere command kyu bhul jata hai"></textarea>`);
}
function openMS360() {
    openWindow('MS 360',
        `<div style="display:flex;justify-content:center;align-items:center;height:100%;
                        color:#555;font-family:monospace;font-size:18px" >
               Chal paise la Year ka ya Month ka Subscription doo<br>
             </div>`);
}
function openCamera() {
    const body = document.createElement('div');
    body.innerHTML = `
      <video autoplay style="width:100%;max-height:140px;border:1px solid #ccc"></video>
      <div style="margin-top:6px;display:flex;gap:6px">
        <button class="snap">📷 Capture</button>
        <button class="rec">● Record</button>
      </div>
      <div class="log" style="font-size:12px;color:#555;margin-top:4px"></div>`;
    const camWin = openWindow('Camera', body);
    const video = body.querySelector('video');
    const snapBtn = body.querySelector('.snap');
    const recBtn = body.querySelector('.rec');
    const logEl = body.querySelector('.log');

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        video.srcObject = stream;
        const recorder = new MediaRecorder(stream);
        let chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' }); chunks = [];
            const src = URL.createObjectURL(blob);
            myPcItems.push({ type: 'video', name: `Recording_${Date.now()}.webm`, src });
            logEl.textContent = 'Video saved to My PC';
        };
        snapBtn.onclick = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth; canvas.height = video.videoHeight;
            canvas.getContext('2d').drawImage(video, 0, 0);
            canvas.toBlob(blob => {
                const src = URL.createObjectURL(blob);
                myPcItems.push({ type: 'image', name: `Image_${Date.now()}.png`, src });
                logEl.textContent = 'Image saved to My PC';
            });
        };
        let rec = false;
        recBtn.onclick = () => {
            if (!rec) { rec = true; recBtn.textContent = '■ Stop'; recorder.start(); logEl.textContent = 'Recording…' }
            else { rec = false; recBtn.textContent = '● Record'; recorder.stop(); }
        };
    }).catch(() => logEl.textContent = 'Camera access denied');
}

// Load Playlist
songs.forEach((song, index) => {
    const li = document.createElement('li');
    li.innerText = song.title;
    li.addEventListener('click', () => loadSong(index));
    playlist.appendChild(li);
});

// Load and play a song
function loadSong(index) {
    currentSongIndex = index;
    const song = songs[index];
    audio.src = song.file;
    title.innerText = song.title;
    highlightCurrentSong();
    audio.play();
    playBtn.innerText = "⏸️";
}

// Highlight current song
function highlightCurrentSong() {
    Array.from(playlist.children).forEach((li, i) => {
        li.classList.toggle('active', i === currentSongIndex);
    });
}

// Play/Pause toggle
playBtn.addEventListener('click', () => {
    if (audio.paused) {
        audio.play();
        playBtn.innerText = "⏸️";
    } else {
        audio.pause();
        playBtn.innerText = "▶️";
    }
});

// Next song
nextBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex + 1) % songs.length;
    loadSong(currentSongIndex);
});

// Previous song
prevBtn.addEventListener('click', () => {
    currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
    loadSong(currentSongIndex);
});

// Auto play next on end
audio.addEventListener('ended', () => {
    nextBtn.click();
});


/* ---------- Quick‑panel behaviour ---------- */
function toggle(btn, key) {
    quickState[key] = !quickState[key];
    btn.classList.toggle('active', quickState[key]);
    if (key === 'wifi') {
        wifiTrayIcon.src = quickState.wifi
            ? 'https://cdn-icons-png.flaticon.com/512/93/93158.png'
            : 'https://cdn-icons-png.flaticon.com/512/578/578459.png';
    }
    if (key === 'air' && quickState.air) {
        quickState.wifi = quickState.bt = false;
        qp.wifi.classList.remove('active');
        qp.bt.classList.remove('active');
        wifiTrayIcon.src = 'https://cdn-icons-png.flaticon.com/512/578/578459.png';
    }
}
qp.wifi.onclick = () => toggle(qp.wifi, 'wifi');
qp.bt.onclick = () => toggle(qp.bt, 'bt');
qp.air.onclick = () => toggle(qp.air, 'air');
qp.power.onclick = () => toggle(qp.power, 'power');
qp.night.onclick = () => {
    toggle(qp.night, 'night');
    document.body.style.filter = quickState.night
        ? 'brightness(60%) sepia(20%)'
        : 'none';
};

/* brightness overlay */
const brightOverlay = document.createElement('div');
brightOverlay.style = `pointer-events:none;position:fixed;top:0;left:0;width:100%;height:100%;
                      background:#000;mix-blend-mode:multiply;opacity:0`;
document.body.appendChild(brightOverlay);
qp.bright.oninput = () => {
    quickState.brightness = qp.bright.value;
    brightOverlay.style.opacity = 1 - quickState.brightness / 100;
};
/* volume slider (placeholder) */
qp.vol.oninput = () => quickState.volume = qp.vol.value;
/* settings stub */
qp.setBtn.onclick = () => alert('Settings window coming soon…');

/* show / hide quick‑panel */
wifiTrayIcon.onclick = e => {
    quickPanel.style.display = quickPanel.style.display === 'none' ? 'block' : 'none';
    e.stopPropagation();
};
document.addEventListener('click', e => {
    if (!quickPanel.contains(e.target) && e.target !== wifiTrayIcon)
        quickPanel.style.display = 'none';
});

/* ---------- Recycle‑bin ---------- */
function updateRecycleBin() {
    recycleList.innerHTML = '';
    deletedFiles.forEach((f, i) => {
        const div = document.createElement('div');
        div.textContent = f.name; div.title = 'Click to restore';
        div.onclick = () => { createFile(f.name); deletedFiles.splice(i, 1); updateRecycleBin(); saveDesktopState(); };
        recycleList.appendChild(div);
    });
    if (!deletedFiles.length) recycleList.innerHTML = '<div style="opacity:.6">Arre kuch ki toh essi tessi kar bhai</div>';
}
recycleBin.onclick = () => {
    recycleList.style.display = recycleList.style.display === 'none' ? 'block' : 'none';
};

/* ---------- Context‑menu actions ---------- */
newFileOpt.onclick = () => { createFile(); contextMenu.style.display = 'none'; };
renameOpt.onclick = () => {
    if (rightClickedFile) { rightClickedFile.fname.contentEditable = true; rightClickedFile.fname.focus(); }
    contextMenu.style.display = 'none';
};
deleteOpt.onclick = () => {
    if (rightClickedFile) {
        deletedFiles.push({ name: rightClickedFile.fname.textContent });
        rightClickedFile.file.remove(); saveDesktopState(); updateRecycleBin();
    }
    contextMenu.style.display = 'none';
};
document.addEventListener('click', e => {
    if (!contextMenu.contains(e.target)) contextMenu.style.display = 'none';
    if (e.target !== startBtn && !startMenu.contains(e.target)) startMenu.style.display = 'none';
});

/* ---------- Start‑menu ---------- */
startBtn.onclick = () => startMenu.style.display =
    startMenu.style.display === 'none' ? 'block' : 'none';
document.querySelectorAll('.start-item').forEach(item => {
    item.onclick = () => {
        startMenu.style.display = 'none';
        switch (item.dataset.app) {
            // case 'brave': openBrave(); break;
            case 'notepad': openNotepad(); break;
            case 'vscode': openVSCode(); break;
            case 'camera': openCamera(); break;
            case 'terminal': openTerminal(); break;
            case 'ms 360': openMS360(); break;
        }
    };
});

/* ---------- Search bar ---------- */
searchInput.onkeydown = e => {
    if (e.key === 'Enter' && searchInput.value.trim()) {
        openBrave(searchInput.value.trim()); searchInput.value = '';
    }
};
braveIcon.onclick = () => openBrave();

/* ---------- Clock ---------- */
function tick() {
    const n = new Date();
    // dtElem.textContent = n.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    dtElem.textContent = n.toLocaleTimeString('en-GB', { day: '2-digit',month:'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
tick(); setInterval(tick, 10000);

/* ---------- Boot‑up ---------- */
createMyPC();
loadDesktopState();
if (!fileCount) { createFile('My File 1'); createFile('My File 2'); }