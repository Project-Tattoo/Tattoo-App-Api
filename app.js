const express = require("express");
const db = require("./server");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/shared/errorController");
require("./models/associations");
const authRoutes = require("./routes/shared/authRoutes");
const usersRoutes = require("./routes/shared/usersRoutes");
const notificationsRoutes = require("./routes/shared/notificationRoutes");
const tosRoutes = require("./routes/shared/tosRoutes")
const emailPreferencesRouter = require("./routes/shared/emailPreferencesRoutes")

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
app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/notifications", notificationsRoutes);
app.use("/api/v1/tos", tosRoutes)
app.use("/api/v1/email-preferences", emailPreferencesRouter)

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
