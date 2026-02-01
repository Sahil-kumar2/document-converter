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

dotenv.config();

const app = express();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    exposedHeaders: ["Content-Disposition"]
  })
);

app.use(express.json());

app.use("/api/convert", convertRoutes);
app.use("/api/black-and-white-image", blackAndWhiteRoutes);
app.use("/api/imageGeneration", imageGenreationRoute);
app.use("/api/imageToText", imageToTextRoute);
app.use("/api/excel", excelMergeRoute);
app.use("/api/pdf", pdfRoutes);
app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
