import fs from "fs";

export const safeUnlink = async (filePath) => {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // ignore missing file
  }
};

export const cleanupPaths = (paths = [], delayMs = 0) => {
  const doCleanup = async () => {
    for (const target of paths) {
      await safeUnlink(target);
    }
  };

  if (delayMs > 0) {
    setTimeout(() => {
      doCleanup();
    }, delayMs);
  } else {
    doCleanup();
  }
};