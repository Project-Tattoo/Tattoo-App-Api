const request = require("supertest");
const db = require("./../../../server");
const app = require("./../../../app");
const Users = require("../../../models/shared/Users");
const EmailPreference = require("../../../models/shared/EmailPreferences");
const TOSAgreement = require("../../../models/shared/TOSAgreement");
const ArtistDetails = require("../../../models/artists/ArtistDetails");
const crypto = require("crypto");

require("dotenv").config({ path: "./.env.test" });

describe("authController Integration Tests", () => {
  beforeEach(async () => {
    await Users.destroy({ truncate: true, cascade: true });
  });

  afterAll(async () => {
    await db.close();
  });

  describe("Signup", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "registrationuser@example.com",
        password: "testpass123",
        passwordConfirm: "testpass123",
        role: "user",
        displayName: "Test User",
        bio: "Test bio",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toEqual("registrationuser@example.com");
      expect(res.body.data.user.role).toEqual("user");
      expect(res.body.data.user.publicId).toBeDefined();

      const userInDb = await Users.findOne({
        where: { email: "registrationuser@example.com" },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.role).toEqual("user");
      expect(userInDb.isActive).toBe(true);
      expect(userInDb.publicId).toBeDefined();

      const userProfileInDb = await Users.findOne({
        where: { id: userInDb.id },
      });
      expect(userProfileInDb).toBeDefined();
      expect(userProfileInDb.displayName).toEqual("Test User");
      expect(userProfileInDb.publicId).toBeDefined();

      const emailPrefInDb = await EmailPreference.findOne({
        where: { userId: userInDb.id },
      });
      expect(emailPrefInDb).toBeDefined();
      expect(emailPrefInDb.marketingEmailsEnabled).toBe(true);

      const tosAgreementInDb = await TOSAgreement.findOne({
        where: { userId: userInDb.id },
      });
      expect(tosAgreementInDb).toBeDefined();
      expect(tosAgreementInDb.tosVersion).toEqual("1.0");
      expect(tosAgreementInDb.ipAddress).toEqual("127.0.0.1");
    });

    it("should register a new artist user successfully", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          firstName: "test",
          lastName: "user",
          email: "testartist@example.com",
          password: "artistpassword123",
          passwordConfirm: "artistpassword123",
          role: "artist",
          city: "New York",
          state: "NY",
          zipcode: "10001",
          stylesOffered: ["Traditional", "Realism"],
          displayName: "newArtist",
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toEqual("testartist@example.com");
      expect(res.body.data.user.role).toEqual("artist");
      expect(res.body.data.user.publicId).toBeDefined();

      const userInDb = await Users.findOne({
        where: { email: "testartist@example.com" },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.role).toEqual("artist");

      const artistProfileInDb = await ArtistDetails.findOne({
        where: { userId: userInDb.id },
      });
      expect(artistProfileInDb).toBeDefined();
      expect(artistProfileInDb.city).toEqual("New York");
      expect(artistProfileInDb.stylesOffered).toEqual([
        "Traditional",
        "Realism",
      ]);
    });

    it("should prevent registration with an existing email", async () => {
      const payload = {
        firstName: "test",
        lastName: "user",
        email: "duplicate@example.com",
        password: "testpass123",
        passwordConfirm: "testpass123",
        role: "user",
        displayName: "User One",
        bio: "First user",
      };

      const firstRes = await request(app)
        .post("/api/v1/auth/signup")
        .send(payload);
      expect(firstRes.statusCode).toBe(201);

      const secondRes = await request(app)
        .post("/api/v1/auth/signup")
        .send(payload);

      expect(secondRes.statusCode).toBe(400);
      expect(secondRes.body.message).toMatch(/duplicate field/i);
    });

    it("should prevent registration with missing mandatory fields", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "",
        password: "somepassword",
        passwordConfirm: "somepassword",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/(email|displayName|bio)/i);
    });

    it("should prevent registration with passwords that don't match", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "mismatch@example.com",
        password: "password123",
        passwordConfirm: "differentPassword123",
        role: "user",
        displayName: "Mismatch Test",
        bio: "Mismatch test",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/passwords do not match/i);
    });

    it("should prevent registration if role is not valid", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "invalidrole@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "superhero",
        displayName: "Invalid Role",
        bio: "Test invalid role",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/invalid.*role/i);
    });

    it("should prevent an attempt to sign up as an admin", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "adminsignup@example.com",
        password: "adminpassword",
        passwordConfirm: "adminpassword",
        role: "admin",
        displayName: "Admin Attempt",
        bio: "Trying to be admin",
      });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toMatch(
        /Admin accounts cannot be registered via public signup./i
      );
    });

    it("should prevent an artist registration with missing required fields", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "artistmissing@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "artist",
        displayName: "artistregistration",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(
        /Please provide city, state, and zipcode for artist registration./i
      );
    });
  });

  describe("Login", () => {
    it("should successfully login a created user", async () => {
      await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "logintest@example.com",
        password: "testpass123",
        passwordConfirm: "testpass123",
        role: "user",
        displayName: "Login Test User",
        bio: "Test bio",
      });

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "logintest@example.com",
        password: "testpass123",
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("logintest@example.com");
    });

    it("should prevent login with incorrect password", async () => {
      console.log("about to create user for test");

      const user = await request(app).post("/api/v1/auth/signup").send({
        firstName: "test",
        lastName: "user",
        email: "wrongpass@example.com",
        password: "correctpassword123",
        passwordConfirm: "correctpassword123",
        role: "user",
        displayName: "Test User",
        bio: "Just testing.",
      });

      console.log("Created user, now attempting bad login...");

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "wrongpass@example.com",
        password: "wrongpassword",
      });

      console.log("Response status:", res.statusCode);
      console.log("Response body:", res.body);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toMatch(/incorrect email or password/i);
    });

    it("should prevent a login with missing credentials", async () => {
      const res = await request(app).post("/api/v1/auth/login").send({});

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(
        /please provide both email and password/i
      );
    });
  });

  describe("Logout", () => {
    it("should successfully logout a user", async () => {
      const res = await request(app).get("/api/v1/auth/logout");

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.message).toMatch(/logged out successfully/i);

      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/jwt=loggedout/);
    });
  });

  describe("Password Reset", () => {
    it("should successfully reset password", async () => {
      const testUser = await Users.create({
        firstName: "Test",
        lastName: "User",
        email: "reset-test@example.com",
        passwordHash: "originalPass123",
        role: "user",
        displayName: "Reset Test",
        isActive: true,
        verifiedEmail: false,
      });

      const validToken = "valid-reset-token-123";
      const hashedToken = crypto
        .createHash("sha256")
        .update(validToken)
        .digest("hex");

      await testUser.update({
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 3600000),
      });

      const res = await request(app)
        .patch("/api/v1/auth/resetPassword")
        .query({ token: validToken })
        .send({
          password: "NewPassword123!",
          passwordConfirm: "NewPassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      const updatedUser = await Users.findOne({
        where: { email: "reset-test@example.com" },
      });
      expect(await updatedUser.correctPassword("NewPassword123!")).toBe(true);
      expect(updatedUser.passwordResetToken).toBeNull();
      expect(updatedUser.passwordResetExpires).toBeNull();

      await Users.destroy({ where: { email: "reset-test@example.com" } });
    });
  });

  describe("Update Password", () => {
    it("should successfully update password", async () => {
      const testUser = await Users.create({
        firstName: "Test",
        lastName: "User",
        email: "updatepass@example.com",
        passwordHash: "originalPass123",
        role: "user",
        displayName: "Update Test",
        isActive: true,
        verifiedEmail: true,
        profilePictureUrl: "https://example.com/profile.jpg",
        socialMediaLinks: {},
      });

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "updatepass@example.com",
        password: "originalPass123",
      });

      const authToken = loginRes.body.token;

      const res = await request(app)
        .patch("/api/v1/auth/updatePassword")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          passwordCurrent: "originalPass123",
          password: "NewSecurePassword123!",
          passwordConfirm: "NewSecurePassword123!",
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("updatepass@example.com");

      const updatedUser = await Users.findOne({
        where: { email: "updatepass@example.com" },
      });
      expect(await updatedUser.correctPassword("NewSecurePassword123!")).toBe(
        true
      );

      await Users.destroy({ where: { email: "updatepass@example.com" } });
    });
  });

  describe("Update Email", () => {
    it("should successfully update email with valid token", async () => {
      const rawToken = "valid-email-token";
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const testUser = await Users.create({
        firstName: "Test",
        lastName: "User",
        email: "old@example.com",
        passwordHash: "password123!",
        role: "user",
        displayName: "UpdateEmailTest",
        isActive: true,
        verifiedEmail: true,
        emailChangeToken: hashedToken,
        emailChangeExpires: new Date(Date.now() + 3600000),
        profilePictureUrl: "https://example.com/profile.jpg",
        socialMediaLinks: {},
      });

      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "old@example.com",
        password: "password123!",
      });

      const authToken = loginRes.body.token;

      const res = await request(app)
        .patch("/api/v1/auth/updateEmail")
        .set("Authorization", `Bearer ${authToken}`)
        .query({ token: rawToken })
        .send({
          newEmail: "new@example.com",
        });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toBe("new@example.com");

      const updatedUser = await Users.findOne({
        where: { id: testUser.id },
      });
      expect(updatedUser.email).toBe("new@example.com");
      expect(updatedUser.emailChangeToken).toBeNull();
      expect(updatedUser.emailChangeExpires).toBeNull();

      await Users.destroy({ where: { id: testUser.id } });
    });
  });

  describe("Deactivate Profile", () => {
    it("should successfully deactivate profile", async () => {
      const testUser = await Users.create({
        firstName: "Test",
        lastName: "User",
        email: "deactivate@example.com",
        passwordHash: "password123!",
        role: "user",
        displayName: "deactivateprofiletest",
        isActive: true,
        verifiedEmail: true,
        profilePictureUrl: "https://example.com/profile.jpg",
        socialMediaLinks: {},
      });

      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: "deactivate@example.com", password: "password123!" });

      const authToken = loginRes.body.token;

      const res = await request(app)
        .patch("/api/v1/auth/deactivateProfile")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/logged out successfully/i);
      expect(res.headers["set-cookie"]).toBeDefined();

      const updatedUser = await Users.findOne({
        where: { email: "deactivate@example.com" },
      });
      expect(updatedUser.isActive).toBe(false);

      await Users.destroy({ where: { email: "deactivate@example.com" } });
    });
  });

  describe("Delete Profile", () => {
    it("should successfully delete a user", async () => {
      const testUser = await Users.create({
        firstName: "Test",
        lastName: "User",
        email: "delete@example.com",
        passwordHash: "password123",
        role: "user",
        displayName: "deletetest",
        isActive: true,
        verifiedEmail: true,
      });

      const deleteRes = await request(app).post("/api/v1/auth/login").send({
        email: "delete@example.com",
        password: "password123",
      });

      const authToken = deleteRes.body.token;

      const res = await request(app)
        .delete("/api/v1/auth/deleteProfile")
        .set("Authorization", `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: "success",
        message: "Deleted profile successfully.",
      });

      const setCookie = res.headers["set-cookie"].find((c) =>
        c.startsWith("jwt=deleted")
      );
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("HttpOnly");

      const deletedUser = await Users.findByPk(testUser.id);
      expect(deletedUser).toBeNull();
    });
  });

  describe("Reactivate Profile", () => {
    it("should successfully reactivate profile with valid token", async () => {
      const rawToken = "valid-reactivation-token";
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const testUser = await Users.create({
        firstName: "Test",
        lastName: "User",
        email: "reactivate@example.com",
        passwordHash: "password123",
        role: "user",
        displayName: "reactivatetest",
        isActive: true,
        verifiedEmail: true,
        reactivateAccountToken: hashedToken,
        reactivateAccountExpires: new Date(Date.now() + 3600000),
      });

      const res = await request(app)
        .patch("/api/v1/auth/reactivateProfile")
        .query({ token: rawToken });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      const updatedUser = await Users.findOne({
        where: { email: "reactivate@example.com" },
      });
      expect(updatedUser.isActive).toBe(true);
      expect(updatedUser.reactivateAccountToken).toBeNull();
      expect(updatedUser.reactivateAccountExpires).toBeNull();

      await Users.destroy({ where: { email: "reactivate@example.com" } });
    });
  });
});
