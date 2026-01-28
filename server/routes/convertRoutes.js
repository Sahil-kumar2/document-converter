const router = require("express").Router();
const upload = require("../middleware/upload");
const { convertFile } = require("../controllers/convertController");

router.post("/", (req, res, next) => {
  console.log(" /api/convert route hit");
  next();
}, upload.single("file"), convertFile);

module.exports = router;
