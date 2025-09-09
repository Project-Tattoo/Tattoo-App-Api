const request = require("supertest");
const db = require("../../../server");
const app = require("../../../app");
const Users = require("../../../models/shared/Users");
const FavoriteArtists = require("../../../models/shared/FavoriteArtists");

require("dotenv").config({ path: "./.env.test" });

describe("favoriteArtistsController Integration Tests", () => {
  let authToken;
  let fanUser;
  let artistUser;

  beforeEach(async () => {
    await FavoriteArtists.destroy({ truncate: true, cascade: true });
    await Users.destroy({ truncate: true, cascade: true });

    fanUser = await Users.create({
      firstName: "fan",
      lastName: "user",
      email: "fanuser@example.com",
      passwordHash: "fanpass123",
      role: "user",
      displayName: "fanUser",
    });

    artistUser = await Users.create({
      firstName: "artist",
      lastName: "user",
      email: "artist@example.com",
      passwordHash: "artistpass123",
      role: "artist",
      displayName: "artistUser",
    });

    const loginRes = await request(app).post("/api/v1/auth/login").send({
      email: "fanuser@example.com",
      password: "fanpass123",
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await db.close();
  });

  describe("getFavoriteArtists", () => {
    it("should return empty list if user has no favorites", async () => {
      const res = await request(app)
        .get("/api/v1/favorites/artists")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(0);
    });

    it("should return user's favorite artists", async () => {
      await FavoriteArtists.create({
        userId: fanUser.id,
        artistId: artistUser.id,
      });

      const res = await request(app)
        .get("/api/v1/favorites/artists")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(1);
      expect(res.body.data.usersFavoriteArtists[0].artistId).toBe(
        artistUser.id
      );
    });

    it("should return 500 if findAll throws", async () => {
      jest
        .spyOn(FavoriteArtists, "findAll")
        .mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .get("/api/v1/favorites/artists")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      FavoriteArtists.findAll.mockRestore();
    });
  });

  describe("getPublicUsersFavoriteArtists", () => {
    it("should return favorites for a public userId", async () => {
      await FavoriteArtists.create({
        userId: fanUser.id,
        artistId: artistUser.id,
      });

      const res = await request(app).get(
        `/api/v1/favorites/artists/public/${fanUser.publicId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(1);
    });

    it("should return empty list if public user has no favorites", async () => {
      const res = await request(app).get(
        `/api/v1/favorites/artists/public/${fanUser.publicId}`
      );

      expect(res.status).toBe(200);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(0);
    });

    it("should return 500 if findAll throws", async () => {
      jest
        .spyOn(FavoriteArtists, "findAll")
        .mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app).get(
        `/api/v1/favorites/artists/public/${fanUser.publicId}`
      );

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      FavoriteArtists.findAll.mockRestore();
    });
  });

  describe("addFavoriteArtist", () => {
    it("should allow user to favorite an artist and increment artist's followers", async () => {
      const res = await request(app)
        .post(`/api/v1/favorites/artists/${artistUser.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(1);

      const refreshedArtist = await Users.findByPk(artistUser.id);
      expect(refreshedArtist.totalFollowers).toBe(1);
    });

    it("should not allow duplicate favorites", async () => {
      await FavoriteArtists.create({
        userId: fanUser.id,
        artistId: artistUser.id,
      });

      const res = await request(app)
        .post(`/api/v1/favorites/artists/${artistUser.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toMatch(/Validation error/i);
    });

    it("should return 500 if create throws", async () => {
      jest
        .spyOn(FavoriteArtists, "create")
        .mockRejectedValueOnce(new Error("DB error"));

      const res = await request(app)
        .post(`/api/v1/favorites/artists/${artistUser.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(500);
      expect(res.body.message).toBe("DB error");

      FavoriteArtists.create.mockRestore();
    });
  });

  describe("removeFavoriteArtist", () => {
    let testFanUser;
    let testArtistUser;
    let testAuthToken;

    beforeEach(async () => {
      // Create fresh users for isolation
      testFanUser = await Users.create({
        publicId: "e26f5b42-0616-4ca9-9ba8-4d5d037a298b",
        firstName: "fan",
        lastName: "user",
        displayName: "Test Fan",
        email: `fanuser432@test.com`,
        role: "user",
        passwordHash: "hashedpassword",
      });

      testArtistUser = await Users.create({
        publicId: "fdfe16f2-cc4c-4e99-a28f-4d0f6354240e",
        firstName: "artist",
        lastName: "user",
        displayName: "Test Artist",
        email: `artistuser432@test.com`,
        role: "artist",
        passwordHash: "hashedpassword",
      });

      const destroyLoginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({
          email: "fanuser432@test.com",
          password: "hashedpassword",
        });

      testAuthToken = destroyLoginRes.body.token;
    });

    it("should remove favorite artist and decrement artist's followers", async () => {
      // Favorite the artist first
      await FavoriteArtists.create({
        userId: testFanUser.id,
        artistId: testArtistUser.id,
      });

      const res = await request(app)
        .delete(`/api/v1/favorites/artists/${testArtistUser.id}`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(0);

      const refreshedArtist = await Users.findByPk(testArtistUser.id);
      expect(refreshedArtist.totalFollowers).toBe(0);
    });

    it("should do nothing if artist is not in favorites", async () => {
      const res = await request(app)
        .delete(`/api/v1/favorites/artists/${testArtistUser.id}`)
        .set("Authorization", `Bearer ${testAuthToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.usersFavoriteArtists).toHaveLength(0);
    });

    
  });
});
