const input = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultList = document.getElementById('resultList');
const statusMsg = document.getElementById('statusMsg');
const confirmBtn = document.getElementById('confirmBtn');
const cardImg = document.getElementById('cardImg');
const cardImgPlaceholder = document.getElementById('cardImgPlaceholder');
const cardTitle = document.getElementById('cardTitle');
const selectedTrackList = document.getElementById('selectedTrackList');

const MAX = 3;

let debounceTimer = null;
let currentQuery = '';
let selected = [];

async function getToken() {
  const res = await fetch("https://elclubdelacorcheatokens.vercel.app/api/token");
  const data = await res.json();

  console.log("TOKEN RESPONSE:", data); // 👈 ADD THIS
  return data.access_token;
}

async function searchTracks(q) {
  const token = await getToken();
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=8`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
}


function updateSelectedTrackList() {
  selectedTrackList.innerHTML = '';
  selected.forEach(track => {
    const li = document.createElement('li');
    li.className = 'selected-track-item';
    li.innerHTML = `
      <div class="selected-track-name">${track.name}</div>
      <div class="selected-track-sub">${track.sub}</div>
    `;
    li.addEventListener('click', () => {
      cardTitle.textContent = track.name;
      if (track.img) {
        cardImg.src = track.img;
        cardImg.style.display = 'block';
        cardImgPlaceholder.style.display = 'none';
      }
    });
    selectedTrackList.appendChild(li);
  });
}

function isSelected(id) { return selected.some(s => s.id === id); }

function resetSearch() {
  input.value = '';
  clearBtn.classList.remove('visible');
  resultList.innerHTML = '';
  statusMsg.className = 'status';
  currentQuery = '';
}

function updateCard() {
  if (selected.length === 0) {
    cardTitle.textContent = 'Find your songs';
    cardImg.style.display = 'none';
    cardImgPlaceholder.style.display = 'block';
  } else {
    const latest = selected[selected.length - 1];
    cardTitle.textContent = latest.name;
    if (latest.img) {
      cardImg.src = latest.img;
      cardImg.style.display = 'block';
      cardImgPlaceholder.style.display = 'none';
    }
  }
  confirmBtn.disabled = selected.length < MAX;
}

function renderResults(tracks) {
  resultList.innerHTML = '';
  statusMsg.className = 'status';

  if (tracks.length === 0) {
    statusMsg.className = 'status visible';
    statusMsg.textContent = 'No songs found.';
    return;
  }

  tracks.forEach(track => {
    const li = document.createElement('li');
    li.className = 'result-item' + (!isSelected(track.id) && selected.length >= MAX ? ' disabled' : '');
    li.dataset.id = track.id;
    const imgHtml = track.img
      ? `<img class="thumb" src="${track.img}" alt="" loading="lazy">`
      : `<div class="thumb-placeholder">🎵</div>`;

    li.innerHTML = `
      ${imgHtml}
      <div class="result-info">
        <div class="result-name">${track.name}</div>
        <div class="result-sub">${track.sub}</div>
      </div>
    `;

    li.addEventListener('click', () => {
  if (isSelected(track.id) || selected.length >= MAX) return;
  selected.push(track);
  updateCard();
  updateSelectedTrackList();
  resetSearch();
});

    resultList.appendChild(li);
  });
}

async function doSearch(q) {
  currentQuery = q;
  resultList.innerHTML = '';
  statusMsg.className = 'status visible';
  statusMsg.innerHTML = '<span class="spinner"></span>Searching…';

  try {
    const data = await searchTracks(q);
    if (q !== currentQuery) return;
    const tracks = (data.tracks?.items || []).map(t => ({
      id: t.id,
      name: t.name,
      sub: t.artists.map(a => a.name).join(', '),
      img: t.album?.images?.[0]?.url || '',
      url: t.external_urls?.spotify
    }));
    renderResults(tracks);
  } catch (e) {
    if (q !== currentQuery) return;
    statusMsg.className = 'status visible';
    statusMsg.textContent = 'Search failed.';
  }
}

input.addEventListener('input', () => {
  const q = input.value.trim();
  clearBtn.classList.toggle('visible', q.length > 0);
  clearTimeout(debounceTimer);
  if (!q) { resultList.innerHTML = ''; statusMsg.className = 'status'; return; }
  debounceTimer = setTimeout(() => doSearch(q), 420);
});

clearBtn.addEventListener('click', () => {
  resetSearch();
  input.focus();
});

confirmBtn.addEventListener('click', () => {
  const names = selected.map(s => `"${s.name}" by ${s.sub}`).join(', ');
  console.log(`Selected: ${names}`);
});




// --- 1. DOWNLOAD LOGIC ---
document.getElementById('downloadBtn').addEventListener('click', async () => {
  const card = document.querySelector('.card');
  const btn = document.getElementById('downloadBtn');
  btn.innerText = "Saving...";

  const canvas = await html2canvas(card, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
  });

  const link = document.createElement('a');
  link.download = 'my-playlist.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
  
  btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Download`;
});

// --- 2. SHARE LOGIC ---
document.getElementById('shareBtn').addEventListener('click', async () => {
  const card = document.querySelector('.card');
  const btn = document.getElementById('shareBtn');

  const canvas = await html2canvas(card, {
    scale: 2,
    useCORS: true,
    backgroundColor: null
  });

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const file = new File([blob], 'playlist.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'My Playlist',
        });
      } catch (err) {
        console.log("Share dismissed");
      }
    } else {
      alert("Sharing not supported on this browser. Try Downloading instead.");
    }
  }, 'image/png');
});


const searchWrap = document.querySelector('.search-wrap');

function updateCard() {
  if (selected.length === 0) {
    cardTitle.textContent = 'Find your songs';
    cardImg.style.display = 'none';
    cardImgPlaceholder.style.display = 'block';
  } else {
    const latest = selected[selected.length - 1];
    cardTitle.textContent = latest.name;
    if (latest.img) {
      cardImg.src = latest.img;
      cardImg.style.display = 'block';
      cardImgPlaceholder.style.display = 'none';
    }
  }
  confirmBtn.disabled = selected.length < MAX;
  searchWrap.style.display = selected.length >= MAX ? 'none' : '';
}