const dotenv = require("dotenv");
const Sequelize = require("sequelize");
const config = require("./config/config");

let db;

process.on("uncaughtException", (err) => {
  console.log("Uncaught exception");
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});

process.env.NODE_ENV = process.env.NODE_ENV || "development";
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

const env = process.env.NODE_ENV;
const envConfig = config[env];

if (!envConfig) {
  console.error("Invalid NODE_ENV:", process.env.NODE_ENV);
  process.exit(1);
}

if (envConfig.database && envConfig.username && envConfig.password) {
  db = new Sequelize(
    envConfig.database,
    envConfig.username,
    envConfig.password,
    {
      ...envConfig,
      logging: process.env.NODE_ENV === "test" ? false : console.log,
    }
  );
} else {
  console.error("Invalid database configuration.");
  process.exit(1);
}

module.exports = db;
