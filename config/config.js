require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DEV_DB_USER,
    password: process.env.DEV_DB_PASS,
    database: process.env.DEV_DB_NAME,
    host: process.env.DEV_DB_HOST,
    dialect: "postgres",
  },
  test: {
    username: process.env.TEST_DB_USER || "test_user",
    password: process.env.TEST_DB_PASS || "test_pass",
    database: process.env.TEST_DB_NAME || "test_db",
    host: process.env.TEST_DB_HOST || "127.0.0.1",
    dialect: "postgres",
  },
  production: {
    username: process.env.PROD_DB_USER,
    password: process.env.PROD_DB_PASS,
    database: process.env.PROD_DB_NAME,
    host: process.env.PROD_DB_HOST,
    dialect: "postgres",
  },
};