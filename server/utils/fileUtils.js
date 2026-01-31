import fs from "fs";

export const deleteFile = async (p) => {
  await fs.promises.unlink(p).catch(() => {});
};
