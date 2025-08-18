const ArtistDetails = require("../../../../models/artists/ArtistDetails");
const VerificationApplications = require("./../../../../models/artists/VerificationApplications");

describe("verificationApplication model", () => {
  let artist;

  beforeAll(async () => {
    artist = await ArtistDetails.create({
      userId: 12345,
      commissionStatus: "open",
      stylesOffered: ["blackwork", "neotraditional"],
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
    await ArtistDetails.destroy({ where: { userId: artist.userId } });
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


  it("throws error when supportingDocuments contains an empty string", async () => {
    await expect(
      VerificationApplications.create({
        artistId: artist.userId,
        bio: "Empty string check",
        portfolioUrl: "https://example.com/portfolio6",
        supportingDocumentsUrl: ["   "],
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
