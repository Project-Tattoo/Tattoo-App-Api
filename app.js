const express = require("express");
const db = require("./server");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/general/errorController");
const authRoutes = require("./routes/general/authRoutes");

const app = express();

const port =
  process.env.NODE_ENV === "development"
    ? process.env.DB_PORT_DEV
    : process.env.DB_PORT_PROD;

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "10kb" }));

app.use(cookieParser());

app.set("trust proxy", true);

app.use("/api/v1/auth", authRoutes);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
