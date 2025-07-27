jest.setTimeout(30000);

require("dotenv").config({ path: ".env.test" });

const { connectToTestDB, closeTestDB } = require("./tests/setupTestDb");

beforeAll(async () => {
  await connectToTestDB();
});

afterAll(async () => {
  await closeTestDB();
});