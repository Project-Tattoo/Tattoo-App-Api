const request = require("supertest");
const app = require("./../../../app");
const Users = require("../../../models/shared/Users");
const EmailPreference = require("../../../models/shared/EmailPreferences");
const TOSAgreement = require("../../../models/shared/TOSAgreement");
const ArtistProfiles = require("../../../models/artists/ArtistProfiles");
const ClientProfiles = require("../../../models/clients/ClientProfiles");
const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const authController = require("../../../controllers/general/authController");
const errorController = require("../../../controllers/general/errorController");

require("dotenv").config({ path: "./.env.test" });

describe("Auth API Integration Tests", () => {
  beforeEach(async () => {
    await Users.destroy({ truncate: true, cascade: true });
  });

 
  // --- Signup Tests ---
  it("should register a new client user successfully", async () => {
    const res = await request(app).post("/api/v1/auth/signup").send({
      email: "testclient@example.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "client",
      displayName: "Test Client User",
      bio: "A client interested in tattoos.",
    });

    // Assertions for the API response
    expect(res.statusCode).toEqual(201);
    expect(res.body.status).toEqual("success");
    expect(res.body.token).toBeDefined();
    expect(res.body.data.user.email).toEqual("testclient@example.com");
    expect(res.body.data.user.role).toEqual("client");
    expect(res.body.data.user.publicId).toBeDefined();

    // Asserts that user and related profiles exist in the database
    const userInDb = await Users.findOne({
      where: { email: "testclient@example.com" },
    });
    expect(userInDb).toBeDefined();
    expect(userInDb.role).toEqual("client");
    expect(userInDb.isActive).toBe(true);
    expect(userInDb.publicId).toBeDefined();

    // Checks client profile association
    const clientProfileInDb = await ClientProfiles.findOne({
      where: { userId: userInDb.id },
    });
    expect(clientProfileInDb).toBeDefined();
    expect(clientProfileInDb.displayName).toEqual("Test Client User");
    expect(clientProfileInDb.publicId).toBeDefined();

    // Checks shared profile associations
    const emailPrefInDb = await EmailPreference.findOne({
      where: { userId: userInDb.id },
    });
    expect(emailPrefInDb).toBeDefined();
    expect(emailPrefInDb.marketingEmailsEnabled).toBe(true);

    // Checks for tosAgreement
    const tosAgreementInDb = await TOSAgreement.findOne({
      where: { userId: userInDb.id },
    });
    expect(tosAgreementInDb).toBeDefined();
    expect(tosAgreementInDb.tosVersion).toEqual("1.0");
    expect(tosAgreementInDb.ipAddress).toEqual("127.0.0.1"); // Ensure normalized IP is stored
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
    expect(artistProfileInDb.stylesOffered).toEqual(["Traditional", "Realism"]);
    expect(artistProfileInDb.publicId).toBeDefined();
  });

  xit("should prevent registration with an existing email", async () => {});

  xit("should prevent registration with missing mandatory fields", async () => {});

  xit("should prevent registration with passwords that dont match", async () => {});

  xit("should prevent registration if role is not valid", () => {});

  xit("should prevent an attempt to sign up as an admin", () => {});

  xit("should prevent an artist registration with missing required fields", async () => {});

  // --- Login Tests ---
  xit("should successfully login a created user", async () => {});

  xit("should prevent a login attempt with incorrect information", async () => {});

  xit("should prevent a login with missing credentials", async () => {});

  // --- Logout Tests ---
  xit("should successfully logout a user", async () => {});


});
