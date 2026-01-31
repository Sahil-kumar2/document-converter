import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import convertRoutes from "./routes/convertRoutes.js";
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    exposedHeaders: ["Content-Disposition"]
  })
);

app.use(express.json());

app.use("/api/convert", convertRoutes);
app.use(errorHandler);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
