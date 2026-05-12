const form = document.getElementById('runnerForm');
const input = document.getElementById('urlInput');
const frame = document.getElementById('webFrame');
const statusText = document.getElementById('statusText');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const newTabBtn = document.getElementById('newTabBtn');

const STORAGE_KEY = 'mobile_runner_state_v2';
const ACCESS_KEY_STORAGE = 'mobile_runner_access_key_v1';

const historyStack = [];
let historyIndex = -1;
let isLocked = false;

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? '#fca5a5' : '';
}
function normalizeUrl(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try { return new URL(withProtocol).toString(); } catch { return ''; }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ historyStack, historyIndex, lastUpdated: Date.now() }));
}
function updateButtons() {
  const blocked = isLocked;
  backBtn.disabled = blocked || historyIndex <= 0;
  forwardBtn.disabled = blocked || historyIndex >= historyStack.length - 1;
  reloadBtn.disabled = blocked || historyIndex < 0;
  newTabBtn.disabled = blocked || historyIndex < 0;
  input.disabled = blocked;
}
function loadUrl(rawUrl, push = true) {
  if (isLocked) return;
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) return setStatus('Invalid URL. Try example.com or https://example.com', true);
  frame.src = normalized;
  input.value = normalized;
  setStatus(`Loading: ${normalized}`);
  if (push) {
    historyStack.splice(historyIndex + 1);
    historyStack.push(normalized);
    historyIndex = historyStack.length - 1;
  }
  saveState();
  updateButtons();
}
function restoreState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.historyStack) || typeof parsed.historyIndex !== 'number') return false;
    historyStack.push(...parsed.historyStack);
    historyIndex = Math.min(parsed.historyIndex, historyStack.length - 1);
    if (historyIndex >= 0 && historyStack[historyIndex]) {
      frame.src = historyStack[historyIndex];
      input.value = historyStack[historyIndex];
      setStatus(`Resumed last task: ${historyStack[historyIndex]}`);
    }
    return true;
  } catch { return false; }
}
function getOrCreateAccessKey() {
  let savedKey = localStorage.getItem(ACCESS_KEY_STORAGE);
  if (!savedKey) {
    savedKey = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
    localStorage.setItem(ACCESS_KEY_STORAGE, savedKey);
  }
  return savedKey;
}
function enforceAccessKey() {
  const key = new URLSearchParams(window.location.search).get('k');
  const expectedKey = getOrCreateAccessKey();
  if (key === expectedKey) return;
  isLocked = true;
  setStatus('Access denied. Invalid key. Open with your private link.', true);
}

form.addEventListener('submit', (e) => { e.preventDefault(); loadUrl(input.value, true); });
backBtn.addEventListener('click', () => { if (historyIndex > 0) { historyIndex -= 1; loadUrl(historyStack[historyIndex], false); }});
forwardBtn.addEventListener('click', () => { if (historyIndex < historyStack.length - 1) { historyIndex += 1; loadUrl(historyStack[historyIndex], false); }});
reloadBtn.addEventListener('click', () => { if (historyIndex >= 0) loadUrl(historyStack[historyIndex], false); });
newTabBtn.addEventListener('click', () => { if (historyIndex >= 0) window.open(historyStack[historyIndex], '_blank', 'noopener,noreferrer'); });
frame.addEventListener('load', () => { const currentUrl = historyStack[historyIndex]; if (currentUrl) setStatus(`Loaded: ${currentUrl}`); });

getOrCreateAccessKey();
enforceAccessKey();
if (!isLocked) setStatus('Access granted. Private session active.');
const restored = restoreState();
if (!restored && !isLocked) loadUrl('https://example.com', true);
updateButtons();
