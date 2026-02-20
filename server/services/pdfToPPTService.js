// import { spawn } from "child_process";
// import path from "path";
// import { fileURLToPath } from "url";

// // Fix __dirname in ES module
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Absolute Python executable path (IMPORTANT)
// const PYTHON_PATH =
//   "C:\\Users\\user\\AppData\\Local\\Python\\bin\\python.exe";

// // Absolute script path (adjust if needed)
// const SCRIPT_PATH = path.resolve(__dirname, "../../python/pdfToPPT.py");

// async function convertPdfBufferToPptBuffer(pdfBuffer) {
//   return new Promise((resolve, reject) => {

//     const python = spawn(PYTHON_PATH, [SCRIPT_PATH]);

//     let chunks = [];
//     let errorOutput = "";

//     python.stdout.on("data", (data) => {
//       chunks.push(data);
//     });

//     python.stderr.on("data", (data) => {
//       errorOutput += data.toString();
//     });

//     python.on("close", (code) => {
//       if (code !== 0) {
//         return reject(
//           new Error(errorOutput || "Python conversion failed")
//         );
//       }

//       resolve(Buffer.concat(chunks));
//     });

//     python.on("error", (err) => {
//       reject(err);
//     });

//     // Prevent write EOF crash
//     if (!python.stdin.destroyed) {
//       python.stdin.write(pdfBuffer);
//       python.stdin.end();
//     }
//   });
// }

// export { convertPdfBufferToPptBuffer };


import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PYTHON_PATH =
  "C:\\Users\\user\\AppData\\Local\\Python\\bin\\python.exe";

const SCRIPT_PATH = path.resolve(__dirname, "../../python/pdfToPPT.py");

async function convertPdfBufferToPptBuffer(pdfBuffer) {
  return new Promise((resolve, reject) => {

    const python = spawn(PYTHON_PATH, [SCRIPT_PATH]);

    let chunks = [];
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      chunks.push(data);
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(errorOutput || "Python conversion failed"));
      }

      resolve(Buffer.concat(chunks));
    });

    python.on("error", (err) => {
      reject(err);
    });

    if (!python.stdin.destroyed) {
      python.stdin.write(pdfBuffer);
      python.stdin.end();
    }
  });
}

export { convertPdfBufferToPptBuffer };