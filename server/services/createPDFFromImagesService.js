import fs from "fs";
import path from "path";
import { PDFDocument } from "pdf-lib";

export const createPdfFromImages = async (files) => {
  const pdfDoc = await PDFDocument.create();

  for (const file of files) {
    let image;

    if (file.mimetype === "image/jpeg") {
      image = await pdfDoc.embedJpg(file.buffer);
    } else if (file.mimetype === "image/png") {
      image = await pdfDoc.embedPng(file.buffer);
    }

    const { width, height } = image.scale(1);
    const page = pdfDoc.addPage([width, height]);

    page.drawImage(image, {
      x: 0,
      y: 0,
      width,
      height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
};
