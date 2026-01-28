const fs = require("fs");
exports.deleteFile = async (p) => fs.promises.unlink(p).catch(() => {});
