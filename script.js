const input = document.getElementById('searchInput');
const clearBtn = document.getElementById('clearBtn');
const resultList = document.getElementById('resultList');
const statusMsg = document.getElementById('statusMsg');
const confirmBtn = document.getElementById('confirmBtn');
const cardImg = document.getElementById('cardImg');
const cardImgPlaceholder = document.getElementById('cardImgPlaceholder');
const cardTitle = document.getElementById('cardTitle');
const selectedTrackList = document.getElementById('selectedTrackList');

const CLIENT_ID = '';
const CLIENT_SECRET = '';
const MAX = 3;

let debounceTimer = null;
let currentQuery = '';
let selected = [];

async function getToken() {
  const res = await fetch("https://elclubdelacorcheatokens.vercel.app/api/token");
  const data = await res.json();
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



document.getElementById('shareBtn').addEventListener('click', async () => {
  const card = document.querySelector('.card');
  const shareBtn = document.getElementById('shareBtn');

  // Simple UI feedback
  const originalText = shareBtn.innerText;
  shareBtn.innerText = "Processing...";

  try {
    const canvas = await html2canvas(card, {
      scale: 2, 
      useCORS: true,
      backgroundColor: null
    });

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'playlist.png', { type: 'image/png' });

      // Check if the browser is capable of sharing this file
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'My Playlist',
            text: 'Check out my selection!'
          });
        } catch (err) {
          // Handled: user closed the menu or share failed
          console.log("Share action dismissed.");
        }
      } else {
        alert("Your browser doesn't support direct image sharing. Try using Safari on iOS or Chrome on Android via HTTPS.");
      }
      
      shareBtn.innerText = originalText;
    }, 'image/png');

  } catch (error) {
    console.error("Error:", error);
    shareBtn.innerText = originalText;
  }
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