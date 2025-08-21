const request = require("supertest");
const db = require("./../../../server");
const app = require("./../../../app");
const Users = require("../../../models/shared/Users");

require("dotenv").config({ path: "./.env.test" });

describe("usersController Integration Tests", () => {
  beforeEach(async () => {
    await Users.destroy({ truncate: true, cascade: true });

    await Users.create({
      firstName: "test",
      lastName: "user",
      email: "testuser@example.com",
      passwordHash: "testpass123",
      role: "user",
      displayName: "TestUser",
      bio: "Test bio",
    });

    await Users.create({
      publicId: "48a8643a-78c4-4e35-9e18-90f572def9b9",
      firstName: "test",
      lastName: "artist",
      email: "testartist@example.com",
      passwordHash: "artistpassword123",
      role: "artist",
      city: "New York",
      state: "NY",
      zipcode: "10001",
      stylesOffered: ["Traditional", "Realism"],
      displayName: "TestArtist",
    });

    await Users.create({
      publicId: "f5e8b2b6-91c0-4d5f-b512-11f8761ee7d2",
      firstName: "second",
      lastName: "artist",
      email: "secondartist@example.com",
      passwordHash: "artistpassword456",
      role: "artist",
      city: "Los Angeles",
      state: "CA",
      zipcode: "90001",
      stylesOffered: ["Abstract", "Minimalist"],
      displayName: "SecondArtist",
      isActive: true,
    });
  });

  afterAll(async () => {
    await db.close();
  });

  describe("getMe", () => {
    it("should successfully register the signed in users personal details", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "testuser@example.com",
        password: "testpass123",
      });

      const authToken = loginRes.body.token;

      const res = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("testuser@example.com");
      expect(res.body.data.user.artistDetail).toBe(null);
    });

    it("should call catchAsync and return 500 if findByPk fails", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "testuser@example.com",
        password: "testpass123",
      });
      const authToken = loginRes.body.token;

      jest
        .spyOn(Users, "findByPk")
        .mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .get("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send();

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");
      Users.findByPk.mockRestore();
    });
  });

  describe("updateMe", () => {
    it("should successfully update the signed in users details", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "testuser@example.com",
        password: "testpass123",
      });

      const authToken = loginRes.body.token;

      const res = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Updated",
          lastName: "Testuser",
          displayName: "updatedUser",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedUser.firstName).toBe("Updated");
      expect(res.body.data.updatedUser.lastName).toBe("Testuser");
      expect(res.body.data.updatedUser.displayName).toBe("updatedUser");
    });

    it("should ignore fields that are not allowed", async () => {
      const loginRes = await request(app).post("/api/v1/auth/login").send({
        email: "testuser@example.com",
        password: "testpass123",
      });

      const authToken = loginRes.body.token;

      const res = await request(app)
        .patch("/api/v1/users/me")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          firstName: "Updated",
          role: "admin", 
          passwordHash: "hacked", 
        });

      expect(res.status).toBe(200);
      expect(res.body.data.updatedUser.firstName).toBe("Updated");
      expect(res.body.data.updatedUser.role).toBe("user");
      expect(res.body.data.updatedUser.passwordHash).not.toBe("hacked"); 
    });
  });

  describe("getUsersPublicProfile", () => {
    it("should fetch a users public profile through their public id", async () => {
      const signupRes = await request(app)
        .post("/api/v1/auth/signup")
        .send({
          firstName: "public",
          lastName: "profile",
          email: "publicProfile@example.com",
          password: "artistpassword123",
          passwordConfirm: "artistpassword123",
          role: "artist",
          city: "New York",
          state: "NY",
          zipcode: "10001",
          stylesOffered: ["Traditional", "Realism"],
          displayName: "publicProfile",
        });

      const res = await request(app)
        .get(`/api/v1/users/${signupRes.body.data.user.publicId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.data.user.publicId).toBe(
        signupRes.body.data.user.publicId
      );
      expect(res.body.data.user.artistDetail).not.toBe(null);
      expect(res.body.data.user.providedArtworks).not.toBe(null);
      expect(res.body.data.user.receivedArtworks).not.toBe(null);
    });

    it("should return 404 if the user does not exist", async () => {
      const res = await request(app)
        .get("/api/v1/users/0ba903c6-62a0-43eb-b93e-ff441c95b6be")
        .send();

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("User not found");
    });
  });

  describe("getRecommendedArtists", () => {
    it("should return a paginated list of recommended artists", async () => {
      const res = await request(app)
        .get("/api/v1/users/recommended-artists?page=1&limit=2")
        .send();

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBeGreaterThan(0);
      expect(res.body.data.artists.length).toBeLessThanOrEqual(2);

      res.body.data.artists.forEach((artist) => {
        expect(artist.role).toBe("artist");
        expect(artist.artistDetail).toBeDefined();
      });
    });

    it("should return 404 if no recommended artists exist", async () => {
      await Users.destroy({ where: { role: "artist" } });

      const res = await request(app)
        .get("/api/v1/users/recommended-artists")
        .send();

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("No recommended artists found");
    });
  });

  describe("getAllArtists", () => {
    it("should return a paginated list of all active artists", async () => {
      const res = await request(app)
        .get("/api/v1/users/all-artists?page=1&limit=10")
        .send();

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBeGreaterThanOrEqual(2);

      res.body.data.artists.forEach((artist) => {
        expect(artist.role).toBe("artist");
        expect(artist.isActive).toBe(true);
      });
    });

    it("should return 404 if no active artists exist", async () => {
      await Users.destroy({ where: { role: "artist", isActive: true } });

      const res = await request(app).get("/api/v1/users/all-artists").send();

      expect(res.status).toBe(404);
      expect(res.body.message).toBe("There were no artists found");
    });
  });
});
