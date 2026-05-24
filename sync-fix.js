let localDirtyUntil = 0;

const originalSave = save;
save = function saveWithSyncGuard() {
  localDirtyUntil = Date.now() + 2500;
  originalSave();
};

const originalSaveCloud = saveCloud;
saveCloud = async function saveCloudWithSyncGuard() {
  localDirtyUntil = Date.now() + 2500;
  await originalSaveCloud();
  localDirtyUntil = Date.now() + 800;
};

const originalPullCloud = pullCloud;
pullCloud = async function pullCloudWithSyncGuard() {
  if (Date.now() < localDirtyUntil || cloudTimer) return;
  await originalPullCloud();
};
