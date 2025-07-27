const { Client } = require("pg");
const config = require("../config/config");

console.log("Initial NODE_ENV:", process.env.NODE_ENV);
require("dotenv").config({
  path: process.env.NODE_ENV === "test" ? "./.env.test" : "./.env.development",
  debug: true, // This will show which file is being loaded
});
console.log("After dotenv NODE_ENV:", process.env.NODE_ENV);

const env = process.env.NODE_ENV || "development";
const dbConfig = config[env];

if (!dbConfig) {
  console.error(`Error: Database configuration not found for NODE_ENV=${env}`);
  process.exit(1);
}

const clientConfig = {
  user: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  ssl:
    dbConfig.dialectOptions && dbConfig.dialectOptions.ssl
      ? dbConfig.dialectOptions.ssl
      : false,
};

const MAX_RETRIES = 30;
const RETRY_INTERVAL_MS = 2000;

async function waitForDb() {
  console.log(process.env.NODE_ENV);
  console.log(process.env.DB_USER)
  console.log(process.env.DB_PASSWORD)
  console.log(process.env.DB_NAME_TEST)
  console.log(
    `Waiting for database (${clientConfig.host}:${clientConfig.port}/${clientConfig.database}) to be ready...`
  );
  for (let i = 0; i < MAX_RETRIES; i++) {
    const client = new Client(clientConfig);
    try {
      await client.connect();
      console.log("Database is ready!");
      await client.end();
      return;
    } catch (err) {
      console.log(
        `Attempt ${i + 1}/${MAX_RETRIES}: Database not ready yet. Error: ${
          err.message
        }. Retrying in ${RETRY_INTERVAL_MS / 1000} seconds...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS));
    } finally {
      if (client && client._connected) {
        try {
          await client.end();
        } catch (e) {}
      }
    }
  }
  console.error(
    "Failed to connect to database after multiple retries. Exiting."
  );
  process.exit(1);
}

waitForDb();
