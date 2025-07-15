jest.setTimeout(30000); // Increase timeout if needed

require("dotenv").config({ path: ".env.test" });

const { connectToTestDB, closeTestDB } = require("./tests/setup/testDb");

beforeAll(async () => {
  await connectToTestDB();
});

afterAll(async () => {
  await closeTestDB();
});