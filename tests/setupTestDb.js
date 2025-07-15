const { Sequelize } = require("sequelize");
const db = require('./../server')

async function connectToTestDB() {
  try {
    await db.authenticate();
    // Sync models and clear database before each test run
    // await db.sync({ force: true });
  } catch (error) {
    console.error("Test DB connection failed:", error);
  }
}

async function closeTestDB() {
  await db.close();
}

module.exports = { connectToTestDB, closeTestDB, db };