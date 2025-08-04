const ArtistProfiles = require("../../../../models/artists/ArtistProfiles");
const VerificationApplications = require("./../../../../models/artists/VerificationApplications");

describe("verificationApplication model", () => {
  let artist;

  beforeAll(async () => {
    artist = await ArtistProfiles.create({
      userId: 12345,
      displayName: "Valid Artist",
      commissionStatus: "open",
      stylesOffered: ["blackwork", "neotraditional"],
      profilePictureUrl: "https://example.com/pic.jpg",
      city: "San Francisco",
      state: "CA",
      zipcode: "94103",
      currencyCode: "USD",
    });
  });

  afterAll(async () => {
    await VerificationApplications.destroy({
      where: { artistId: artist.userId },
    });
    await ArtistProfiles.destroy({ where: { userId: artist.userId } });
  });

  it("throws error when supportingDocuments is not a valid URL array", async () => {
    await expect(
      VerificationApplications.create({
        artistId: artist.userId,
        bio: "Tattoo artist",
        portfolioUrl: "https://example.com/portfolio",
        supportingDocumentsUrl: ["", 123, "not-a-url"],
      })
    ).rejects.toThrow("All supporting documents must be valid URLs.");
  });

  it("throws error when supportingDocuments is not an array", async () => {
    await expect(
      VerificationApplications.create({
        artistId: artist.userId,
        bio: "Another tattoo artist",
        portfolioUrl: "https://example.com/portfolio2",
        supportingDocumentsUrl: "not-an-array",
      })
    ).rejects.toThrow("Supporting documents must be an array.");
  });

  it("throws specifically on typeof !== 'string'", async () => {
    await expect(
      VerificationApplications.create({
        artistId: artist.userId,
        bio: "Type-only check",
        portfolioUrl: "https://example.com/portfolio4",
        supportingDocumentsUrl: [false],
      })
    ).rejects.toThrow("All supporting documents must be valid URLs.");
  });

  it("throws error when supportingDocuments contains invalid URL strings", async () => {
    await expect(
      VerificationApplications.create({
        artistId: artist.userId,
        bio: "Regex fail case",
        portfolioUrl: "https://example.com/portfolio5",
        supportingDocumentsUrl: ["not-a-valid-url"],
      })
    ).rejects.toThrow("All supporting documents must be valid URLs.");
  });

  it("throws error when supportingDocuments contains a string that fails the URL regex", async () => {
    await expect(
      VerificationApplications.create({
        artistId: artist.userId,
        bio: "Regex fail case",
        portfolioUrl: "https://example.com/portfolio7",
        supportingDocumentsUrl: ["not-a-valid-url"], // doesn't start with http/https
      })
    ).rejects.toThrow("All supporting documents must be valid URLs.");
  });
});
