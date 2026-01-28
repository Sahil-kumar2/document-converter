require("dotenv").config();
const express = require("express");
const cors = require("cors");
const convertRoutes = require("./routes/convertRoutes");
const errorHandler = require("./middleware/errorHandler");

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
