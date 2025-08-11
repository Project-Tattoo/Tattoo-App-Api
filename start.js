const app = require("./app");
const db = require("./server");
const waitForDb = require("./utils/waitForDb");
const dotenv = require("dotenv");
const path = require("path");

const envPath =
  process.env.NODE_ENV === "test" ? ".env.test" : ".env.development";
dotenv.config({ path: path.resolve(__dirname, envPath) });

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception");
  console.error(err.name, err.message, err.stack);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

const port = process.env.APP_PORT || 3000;

let server;
async function startApplication() {
  try {
    await waitForDb();
    await db.authenticate();
    server = app.listen(port, () => {
      console.log(
        `App ruinning on port ${port} in ${process.env.NODE_ENV} mode.`
      );
      console.log(`Access at: http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      "Application failed to start due to database or other issues:",
      error
    );
    process.exit(1);
  }
}
startApplication()