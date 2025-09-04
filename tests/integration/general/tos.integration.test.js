const request = require("supertest");
const db = require("../../../server");
const app = require("../../../app");
const Users = require("./../../../models/shared/Users")
const TOSAgreement = require("./../../../models/shared/TOSAgreement")

require("dotenv").config({ path: "./.env.test" });

describe("tosController Integration Tests", () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await TOSAgreement.destroy({ truncate: true, cascade: true });
    await Users.destroy({ truncate: true, cascade: true });

    testUser = await Users.create({
      firstName: "tos",
      lastName: "user",
      email: "tosuser@example.com",
      passwordHash: "tosuserpass123",
      role: "user",
      displayName: "tosUser",
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "tosuser@example.com",
      password: "tosuserpass123",
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe("agreeToTos", () => {
    it("should allow a user to agree to the TOS", async () => {
      const res = await request(app)
        .post("/api/v1/tos")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ tosVersion: "1.0.0" });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe("success");
      expect(res.body.data.agreement.tosVersion).toBe("1.0.0");
      expect(res.body.data.agreement.userId).toBe(testUser.id);
    });

    it("should fail if tosVersion is missing", async () => {
      const res = await request(app)
        .post("/api/v1/tos")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(res.status).toBe(500); 
      expect(res.body.message).toMatch(/TOS version is required/i);
    });

    it("should return 500 if create throws an error", async () => {
      jest.spyOn(TOSAgreement, "create").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .post("/api/v1/tos")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ tosVersion: "1.0.1" });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      TOSAgreement.create.mockRestore();
    });
  });

  describe("getAgreedTos", () => {
    it("should return the latest agreement for the user", async () => {
      await TOSAgreement.create({
        userId: testUser.id,
        tosVersion: "1.0.0",
        agreedAt: new Date(),
        ipAddress: "127.0.0.1",
      });

      const res = await request(app)
        .get("/api/v1/tos/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.tosVersion).toBe("1.0.0");
    });

    it("should return null if user has not agreed yet", async () => {
      const res = await request(app)
        .get("/api/v1/tos/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data).toBe(null);
    });

    it("should return 500 if findOne throws an error", async () => {
      jest.spyOn(TOSAgreement, "findOne").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .get("/api/v1/tos/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      TOSAgreement.findOne.mockRestore();
    });
  });
});