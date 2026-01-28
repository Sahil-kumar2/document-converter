const PYTHON_PATH = "C:\\Users\\sahil\\AppData\\Local\\Programs\\Python\\Python313\\python.exe";

const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");

exports.runConversion = (inputPath, outputDir, format) => {
  return new Promise((resolve, reject) => {
    const safeFormat = format.replace(/[^a-z]/gi, "").toLowerCase();
    const inputExt = path.extname(inputPath).toLowerCase();

    // CASE 1: PDF → DOCX (Python)
    if (inputExt === ".pdf" && safeFormat === "docx") {
      const outputFile = path.join(
        outputDir,
        path.parse(inputPath).name + ".docx"
      );

      const pyCommand = `"${PYTHON_PATH}" services/pdfToDocx.py "${inputPath}" "${outputFile}"`;
      console.log("🐍 Running Python PDF→Word:", pyCommand);

      exec(pyCommand, (err, stdout, stderr) => {
        console.log("📤 Python stdout:", stdout);
        console.log("⚠️ Python stderr:", stderr);
        if (err) return reject(err);
        return resolve(outputFile);
      });

      return;
    }

    // CASE 2: PDF → XLSX (Python)
    if (inputExt === ".pdf" && safeFormat === "xlsx") {
      const outputFile = path.join(
        outputDir,
        path.parse(inputPath).name + ".xlsx"
      );

      const pyCommand = `"${PYTHON_PATH}" services/pdfToExcel.py "${inputPath}" "${outputFile}"`;
      console.log("🐍 Running Python PDF→Excel:", pyCommand);

      exec(pyCommand, (err, stdout, stderr) => {
        console.log("📤 Python stdout:", stdout);
        console.log("⚠️ Python stderr:", stderr);
        if (err) return reject(err);
        return resolve(outputFile);
      });

      return;
    }


    // CASE 3: All Other Conversions (LibreOffice)
    const command = `soffice --headless --convert-to ${safeFormat} "${inputPath}" --outdir "${outputDir}"`;
    console.log("🖥 Running LibreOffice command:", command);

    exec(command, (err, stdout, stderr) => {
      console.log("📤 LibreOffice stdout:", stdout);
      console.log("⚠️ LibreOffice stderr:", stderr);
      if (err) return reject(err);

      // Find newest file created
      fs.readdir(outputDir, (err, files) => {
        if (err) return reject(err);
        if (!files.length) return reject("No output file created");

        const fullPaths = files.map(f => path.join(outputDir, f));
        const newestFile = fullPaths
          .map(f => ({ file: f, time: fs.statSync(f).mtime.getTime() }))
          .sort((a, b) => b.time - a.time)[0].file;

        resolve(newestFile);
      });
    });
  });
};
