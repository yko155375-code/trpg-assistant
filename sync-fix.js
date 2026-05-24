var localDirtyUntil = 0;

var originalSave = save;
save = function saveWithSyncGuard() {
  localDirtyUntil = Date.now() + 1800;
  originalSave();
};

var originalSaveCloud = saveCloud;
saveCloud = async function saveCloudWithSyncGuard() {
  localDirtyUntil = Date.now() + 1800;
  try {
    await originalSaveCloud();
  } finally {
    localDirtyUntil = Date.now() + 350;
  }
};

var originalPullCloud = pullCloud;
pullCloud = async function pullCloudWithSyncGuard() {
  if (Date.now() < localDirtyUntil) return;
  await originalPullCloud();
};

setInterval(() => {
  pullCloud();
}, 1200);
