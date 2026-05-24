var localDirtyUntil = 0;

function isEditingText() {
  var el = document.activeElement;
  if (!el) return false;
  return el.matches('input, textarea, select, [contenteditable="true"]');
}

function protectLocalEdit(ms = 2500) {
  localDirtyUntil = Math.max(localDirtyUntil, Date.now() + ms);
}

document.addEventListener('focusin', (event) => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) protectLocalEdit(6000);
});

document.addEventListener('input', (event) => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) protectLocalEdit(6000);
}, true);

document.addEventListener('focusout', (event) => {
  if (event.target.matches('input, textarea, select, [contenteditable="true"]')) {
    protectLocalEdit(900);
    setTimeout(() => pullCloud(), 1000);
  }
});

var originalSave = save;
save = function saveWithSyncGuard() {
  protectLocalEdit(isEditingText() ? 6000 : 1800);
  originalSave();
};

var originalSaveCloud = saveCloud;
saveCloud = async function saveCloudWithSyncGuard() {
  protectLocalEdit(isEditingText() ? 6000 : 1800);
  try {
    await originalSaveCloud();
  } finally {
    protectLocalEdit(isEditingText() ? 6000 : 350);
  }
};

var originalApplyRemote = applyRemote;
applyRemote = function applyRemoteWithTypingGuard(row) {
  if (Date.now() < localDirtyUntil || isEditingText()) return;
  originalApplyRemote(row);
};

var originalPullCloud = pullCloud;
pullCloud = async function pullCloudWithTypingGuard() {
  if (Date.now() < localDirtyUntil || isEditingText()) return;
  await originalPullCloud();
};

setInterval(() => {
  pullCloud();
}, 1200);
