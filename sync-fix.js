var syncClientId = localStorage.getItem('trpg-sync-client-id') || (crypto.randomUUID ? crypto.randomUUID() : 'client-' + Date.now() + '-' + Math.random());
localStorage.setItem('trpg-sync-client-id', syncClientId);
var localDirtyUntil = 0;
var reliableSaveTimer = null;
var lastLocalSyncStamp = state._sync?.updatedAt || '';

function isEditingText() {
  var el = document.activeElement;
  if (!el) return false;
  return el.matches('input, textarea, select, [contenteditable="true"]');
}

function protectLocalEdit(ms = 2500) {
  localDirtyUntil = Math.max(localDirtyUntil, Date.now() + ms);
}

function activeTextSnapshot() {
  var el = document.activeElement;
  if (!el || !el.matches('input, textarea')) return null;
  return {
    id: el.id,
    value: el.value,
    start: el.selectionStart,
    end: el.selectionEnd,
  };
}

function restoreTextSnapshot(snapshot) {
  if (!snapshot?.id) return;
  var el = document.getElementById(snapshot.id);
  if (!el || !el.matches('input, textarea')) return;
  el.value = snapshot.value;
  el.focus();
  try { el.setSelectionRange(snapshot.start, snapshot.end); } catch {}
}

var originalRender = render;
render = function renderWithInputProtection() {
  var snapshot = activeTextSnapshot();
  originalRender();
  if (isEditingText()) restoreTextSnapshot(snapshot);
};

async function reliablePushCloud() {
  state._sync = { clientId: syncClientId, updatedAt: new Date().toISOString() };
  lastLocalSyncStamp = state._sync.updatedAt;
  localStorage.setItem(storageKey, JSON.stringify(state));
  try {
    var response = await cloudFetch('?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: roomId, state, updated_at: state._sync.updatedAt }),
    });
    var data = await response.json();
    if (data?.[0]?.updated_at) lastCloudUpdated = data[0].updated_at;
  } catch (error) {
    console.warn('reliable sync failed', error);
  } finally {
    protectLocalEdit(isEditingText() ? 4000 : 400);
  }
}

save = function saveReliably() {
  protectLocalEdit(isEditingText() ? 5000 : 1800);
  localStorage.setItem(storageKey, JSON.stringify(state));
  clearTimeout(reliableSaveTimer);
  reliableSaveTimer = setTimeout(reliablePushCloud, 180);
};

saveCloud = reliablePushCloud;

var originalApplyRemote = applyRemote;
applyRemote = function applyRemoteSafely(row) {
  if (!row?.state) return;
  if (Date.now() < localDirtyUntil || isEditingText()) return;
  var remoteStamp = row.state._sync?.updatedAt || row.updated_at || '';
  var remoteClient = row.state._sync?.clientId || '';
  if (remoteClient === syncClientId && remoteStamp <= lastLocalSyncStamp) return;
  originalApplyRemote(row);
  lastLocalSyncStamp = remoteStamp;
};

var originalPullCloud = pullCloud;
pullCloud = async function pullCloudSafely() {
  if (Date.now() < localDirtyUntil || isEditingText()) return;
  await originalPullCloud();
};

document.addEventListener('focusin', (event) => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) protectLocalEdit(5000);
});

document.addEventListener('input', (event) => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) protectLocalEdit(5000);
}, true);

document.addEventListener('focusout', (event) => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
    protectLocalEdit(600);
    setTimeout(() => reliablePushCloud(), 120);
    setTimeout(() => pullCloud(), 900);
  }
});

setInterval(() => {
  pullCloud();
}, 1200);
