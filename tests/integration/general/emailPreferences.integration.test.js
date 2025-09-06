const request = require("supertest");
const db = require("../../../server");
const app = require("../../../app");
const Users = require("../../../models/shared/Users");
const EmailPreferences = require("../../../models/shared/EmailPreferences");

require("dotenv").config({ path: "./.env.test" });

describe("emailPreferencesController Integration Tests", () => {
  let authToken;
  let testUser;

  beforeEach(async () => {
    await EmailPreferences.destroy({ truncate: true, cascade: true });
    await Users.destroy({ truncate: true, cascade: true });

    testUser = await Users.create({
      firstName: "email",
      lastName: "user",
      email: "emailuser@example.com",
      passwordHash: "emailuserpass123",
      role: "user",
      displayName: "emailUser",
    });

    // create initial emailPreferences for user
    await EmailPreferences.create({
      userId: testUser.id,
      marketingEmailsEnabled: true,
      notificationEmailsEnabled: true,
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "emailuser@example.com",
      password: "emailuserpass123",
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe("getEmailPreferences", () => {
    it("should return the user's email preferences", async () => {
      const res = await request(app)
        .get("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.emailPreference.userId).toBe(testUser.id);
      expect(res.body.data.emailPreference.marketingEmailsEnabled).toBe(true);
      expect(res.body.data.emailPreference.notificationEmailsEnabled).toBe(true);
    });

    it("should return null if no preferences exist", async () => {
      await EmailPreferences.destroy({ where: { userId: testUser.id } });

      const res = await request(app)
        .get("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.emailPreference).toBe(null);
    });

    it("should return 500 if findOne throws an error", async () => {
      jest.spyOn(EmailPreferences, "findOne").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .get("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      EmailPreferences.findOne.mockRestore();
    });
  });

  describe("updateEmailPreferences", () => {
    it("should update the user's preferences", async () => {
      const res = await request(app)
        .patch("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ marketingEmailsEnabled: false });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.updatedEmailPreferences.marketingEmailsEnabled).toBe(false);
      expect(res.body.data.updatedEmailPreferences.notificationEmailsEnabled).toBe(true);
    });

    it("should ignore fields not in the allowed list", async () => {
      const res = await request(app)
        .patch("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          marketingEmailsEnabled: false,
          notificationEmailsEnabled: false,
          hackedField: "notAllowed",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedEmailPreferences.hackedField).toBeUndefined();
    });

    it("should return 500 if update throws an error", async () => {
      jest.spyOn(EmailPreferences, "update").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .patch("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ marketingEmailsEnabled: false });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      EmailPreferences.update.mockRestore();
    });

    it("should return 500 if findByPk throws an error after update", async () => {
      jest.spyOn(EmailPreferences, "findByPk").mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .patch("/api/v1/email-preferences/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ notificationEmailsEnabled: false });

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      EmailPreferences.findByPk.mockRestore();
    });
  });
});