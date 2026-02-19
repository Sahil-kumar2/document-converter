// import fs from "fs/promises";
// import { mergeExcelFiles } from "../services/excelServices.js";

// export async function mergeExcelController(req, res) {
//   try {
//     if (!req.files || req.files.length < 2) {
//       return res.status(400).json({
//         success: false,
//         message: "At least 2 Excel files are required",
//       });
//     }

//     const filePaths = req.files.map((f) => f.path);

//     // 👇 Service should return BUFFER (not file path)
//     const mergedBuffer = await mergeExcelFiles(filePaths);

//     // 🔥 Delete uploaded temp files immediately
//     await Promise.all(filePaths.map((p) => fs.unlink(p)));

//     // Send file directly
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename="merged-${Date.now()}.xlsx"`
//     );
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     ); 

//     return res.send(mergedBuffer);

//   } catch (err) {
//     console.error(err);
//     return res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// }

import fs from "fs/promises";
import { mergeExcelFiles } from "../services/excelServices.js";

export async function mergeExcelController(req, res) {
  let filePaths = [];

  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({
        success: false,
        message: "At least 2 Excel files are required",
      });
    }

    filePaths = req.files.map((f) => f.path);

    // Service returns BUFFER
    const mergedBuffer = await mergeExcelFiles(filePaths);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="merged-${Date.now()}.xlsx"`
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    return res.send(mergedBuffer);

  } catch (err) {
    console.error("Merge Excel Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  } finally {
    // 🔥 Always delete uploaded temp files
    if (filePaths.length > 0) {
      await Promise.all(
        filePaths.map((p) =>
          fs.unlink(p).catch(() => {})
        )
      );
    }
  }
}



