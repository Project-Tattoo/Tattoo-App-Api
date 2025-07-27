const express = require("express");
const db = require("./server");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const authRoutes = require("./routes/authRoutes");

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

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

db.authenticate().then(() => {
  app.listen(port, () => {
    console.log(`Database connection successful, listening on port ${port}`);
  });
});

module.exports = app;
