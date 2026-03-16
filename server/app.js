import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import convertRoutes from "./routes/convertRoutes.js";
import blackAndWhiteRoutes from "./routes/blackAndWhiteRoutes.js";
import errorHandler from "./middleware/errorHandler.js";
import imageGenreationRoute from "./routes/imageGenerationRoutes.js"
import excelMergeRoute from "./routes/excelMergeRoute.js";
import imageToTextRoute from "./routes/imageToTextRoute.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import compressPdfRoutes from "./routes/compressPdfRoutes.js";
import mergePdfRoutes from "./routes/mergePdfRoutes.js";
import removePagesRoutes from "./routes/removePagesRoutes.js";
import repairPdfRoutes from "./routes/repairPdfRoutes.js";
import routesIndex from "./routes/index.js";
import lockDocRoute from "./routes/lockDocumentRoutes.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";

dotenv.config();

const app = express();

// Trust reverse proxy (Render, Nginx, etc.) so req.ip and x-forwarded-for work correctly
app.set('trust proxy', true);

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174", "https://document-converter-06yv.onrender.com"],
    exposedHeaders: ["Content-Disposition", "X-Original-Size", "X-Compressed-Size"]
  })
);

app.use(express.json());

app.use("/api/convert", convertRoutes);
app.use("/api/black-and-white-image", blackAndWhiteRoutes);
app.use("/api/imageGeneration", imageGenreationRoute);
app.use("/api/imageToText", imageToTextRoute);
app.use("/api/excel", excelMergeRoute);
app.use("/api/pdf", pdfRoutes);
app.use("/api/pdf", compressPdfRoutes);
app.use("/api/pdf", mergePdfRoutes);
app.use("/api/pdf", removePagesRoutes);
app.use("/api/pdf", repairPdfRoutes);
app.use("/api", routesIndex);
app.use("/api", lockDocRoute);
app.use("/api/chatbot", chatbotRoutes);
app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
