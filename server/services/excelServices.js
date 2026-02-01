import XLSX from "xlsx";
import path from "path";
import fs from "fs";

export function mergeExcelFiles(filePaths) {
  let allRows = [];
  let allHeaders = new Set();

  // 1️⃣ Read all files & collect headers
  filePaths.forEach(filePath => {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    data.forEach(row => {
      Object.keys(row).forEach(key => allHeaders.add(key));
      allRows.push(row);
    });
  });

  const headers = Array.from(allHeaders);

  // 2️⃣ Normalize rows (fix column mismatch)
  const normalizedRows = allRows.map(row => {
    let newRow = {};
    headers.forEach(h => {
      newRow[h] = row[h] ?? "";
    });
    return newRow;
  });

  // 3️⃣ Write merged Excel
  const newSheet = XLSX.utils.json_to_sheet(normalizedRows, {
    header: headers
  });

  const newWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(newWb, newSheet, "Merged");

  const outputPath = path.join("uploads", "merged.xlsx");
  XLSX.writeFile(newWb, outputPath);

  return outputPath;
}
