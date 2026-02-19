// import XLSX from "xlsx";
// import path from "path";

// export function mergeExcelFiles(filePaths) {
//   let outputAOA = [];

//   filePaths.forEach(filePath => {
//     const wb = XLSX.readFile(filePath);

//     wb.SheetNames.forEach(sheetName => {
//       const sheet = wb.Sheets[sheetName];
//       if (!sheet || !sheet["!ref"]) return;

  
//       const range = XLSX.utils.decode_range(sheet["!ref"]);

      
//       const block = XLSX.utils.sheet_to_json(sheet, {
//         header: 1,
//         defval: "",
//         range: range
//       });

//       if (!block.length) return;

  
//       const cleaned = block.filter(row =>
//         row.some(cell => cell !== "")
//       );

//       if (!cleaned.length) return;

//       if (outputAOA.length) {
//         outputAOA.push([]);
//       }

//       cleaned.forEach(r => outputAOA.push(r));
//     });
//   });

 
//   const outSheet = XLSX.utils.aoa_to_sheet(outputAOA);
//   const outWb = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(outWb, outSheet, "Merged");

//   const outputPath = path.join(
//     "uploads",
//     `merged-${Date.now()}.xlsx`
//   );

//   XLSX.writeFile(outWb, outputPath);
//   return outputPath;
// }


import XLSX from "xlsx";

export function mergeExcelFiles(filePaths) {
  let outputAOA = [];

  filePaths.forEach(filePath => {
    const wb = XLSX.readFile(filePath);

    wb.SheetNames.forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      if (!sheet || !sheet["!ref"]) return;

      const block = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: ""
      });

      if (!block.length) return;

      const cleaned = block.filter(row =>
        row.some(cell => cell !== "")
      );

      if (!cleaned.length) return;

      if (outputAOA.length) {
        outputAOA.push([]);
      }

      cleaned.forEach(r => outputAOA.push(r));
    });
  });

  const outSheet = XLSX.utils.aoa_to_sheet(outputAOA);
  const outWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(outWb, outSheet, "Merged");

  // 🔥 RETURN REAL BUFFER
  const buffer = XLSX.write(outWb, {
    type: "buffer",
    bookType: "xlsx",
  });

  return buffer;
}

