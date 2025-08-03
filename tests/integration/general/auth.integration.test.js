const request = require("supertest");
const db = require("./../../../server");
const app = require("./../../../app");
const Users = require("../../../models/shared/Users");
const EmailPreference = require("../../../models/shared/EmailPreferences");
const TOSAgreement = require("../../../models/shared/TOSAgreement");
const ArtistProfiles = require("../../../models/artists/ArtistProfiles");
const ClientProfiles = require("../../../models/clients/ClientProfiles");

require("dotenv").config({ path: "./.env.test" });

describe("Auth API Integration Tests", () => {
  beforeEach(async () => {
    await Users.destroy({ truncate: true, cascade: true });
  });

  afterAll(async () => {
    await db.close();
  });

  describe("Signup", () => {
    it("should register a new client user successfully", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "testclient@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "client",
        displayName: "Test Client User",
        bio: "A client interested in tattoos.",
      });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toEqual("success");
      expect(res.body.token).toBeDefined();
      expect(res.body.data.user.email).toEqual("testclient@example.com");
      expect(res.body.data.user.role).toEqual("client");
      expect(res.body.data.user.publicId).toBeDefined();

      const userInDb = await Users.findOne({
        where: { email: "testclient@example.com" },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb.role).toEqual("client");
      expect(userInDb.isActive).toBe(true);
      expect(userInDb.publicId).toBeDefined();

      const clientProfileInDb = await ClientProfiles.findOne({
        where: { userId: userInDb.id },
      });
      expect(clientProfileInDb).toBeDefined();
      expect(clientProfileInDb.displayName).toEqual("Test Client User");
      expect(clientProfileInDb.publicId).toBeDefined();

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
          email: "testartist@example.com",
          password: "artistpassword123",
          passwordConfirm: "artistpassword123",
          role: "artist",
          displayName: "Artist A",
          bio: "Specializing in traditional tattoos.",
          city: "New York",
          state: "NY",
          zipcode: "10001",
          stylesOffered: ["Traditional", "Realism"],
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

      const artistProfileInDb = await ArtistProfiles.findOne({
        where: { userId: userInDb.id },
      });
      expect(artistProfileInDb).toBeDefined();
      expect(artistProfileInDb.displayName).toEqual("Artist A");
      expect(artistProfileInDb.city).toEqual("New York");
      expect(artistProfileInDb.stylesOffered).toEqual([
        "Traditional",
        "Realism",
      ]);
      expect(artistProfileInDb.publicId).toBeDefined();
    });

    it("should prevent registration with an existing email", async () => {
      const payload = {
        email: "duplicate@example.com",
        password: "testpass123",
        passwordConfirm: "testpass123",
        role: "client",
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
        email: "",
        password: "somepassword",
        passwordConfirm: "somepassword",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/(email|displayName|bio)/i);
    });

    it("should prevent registration with passwords that don't match", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
        email: "mismatch@example.com",
        password: "password123",
        passwordConfirm: "differentPassword123",
        role: "client",
        displayName: "Mismatch Test",
        bio: "Mismatch test",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(/passwords do not match/i);
    });

    it("should prevent registration if role is not valid", async () => {
      const res = await request(app).post("/api/v1/auth/signup").send({
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
        email: "artistmissing@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "artist",
        displayName: "Missing Artist",
        bio: "Testing artist flow",
      });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toMatch(
        /Please provide display name, city, state, and zipcode for artist registration./i
      );
    });
  });

  describe("Login", () => {
    it("should successfully login a created user", async () => {
      await request(app).post("/api/v1/auth/signup").send({
        email: "logintest@example.com",
        password: "testpass123",
        passwordConfirm: "testpass123",
        role: "client",
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
        email: "wrongpass@example.com",
        password: "correctpassword123",
        passwordConfirm: "correctpassword123",
        role: "client",
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
});
