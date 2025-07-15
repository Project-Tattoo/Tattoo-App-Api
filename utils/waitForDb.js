const { Sequelize } = require("sequelize");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" }); // Load environment variables

// Determine whether we're in development or testing
const isTestEnv = process.env.NODE_ENV === "test";

// Use different environment variables based on the current environment (dev or test)
const dbConfig = {
  database: isTestEnv
    ? process.env.TEST_DATABASE_NAME
    : process.env.DEV_DATABASE_NAME,
  username: isTestEnv
    ? process.env.TEST_DATABASE_USER
    : process.env.DEV_DATABASE_USER,
  password: isTestEnv
    ? process.env.TEST_DATABASE_PASSWORD
    : process.env.DEV_DATABASE_PASSWORD,
  host: isTestEnv
    ? process.env.TEST_DATABASE_HOST
    : process.env.DEV_DATABASE_HOST,
  port: isTestEnv
    ? process.env.TEST_DATABASE_PORT
    : process.env.DEV_DATABASE_PORT,
};

const db = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    dialect: "postgres",
    host: dbConfig.host,
    port: dbConfig.port,
    charset: "utf8",
    ssl: true,
    logging: false,
  }
);

const checkDbReady = async () => {
  let attempts = 0;
  const MAX_ATTEMPTS = 30; 
  const RETRY_INTERVAL = 2000; 

  while (attempts < MAX_ATTEMPTS) {
    try {
      console.log(`Attempting to connect to the database (Attempt ${attempts + 1}/${MAX_ATTEMPTS})...`);
      await db.authenticate();
      console.log("Database is ready!");
      return; 
    } catch (error) {
      attempts++;
      console.error(`Database not ready yet, retrying in ${RETRY_INTERVAL / 1000} seconds...`, error.message);
      if (attempts >= MAX_ATTEMPTS) {
        console.error("Exceeded maximum database connection attempts. Exiting.");
        throw new Error("Failed to connect to the database after multiple attempts."); 
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL));
    }
  }
};

checkDbReady();
