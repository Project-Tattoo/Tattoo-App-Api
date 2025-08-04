const ArtistProfiles = require("./../../../../models/artists/ArtistProfiles");

describe("artistProfiles", () => {
  it("throws error when stylesOffered is not an array", async () => {
    await expect(
      ArtistProfiles.create({
        userId: 1,
        displayName: "CoolArtist",
        commissionStatus: "open",
        stylesOffered: "not-an-array",
        profilePictureUrl: "https://valid.url",
        city: "Seattle",
        state: "WA",
        zipcode: "98101",
        currencyCode: "USD",
      })
    ).rejects.toThrow("Styles offered must be an array.");
  });

  it("throws error when stylesOffered has empty or non-string items", async () => {
    await expect(
      ArtistProfiles.create({
        userId: 2,
        displayName: "AnotherArtist",
        commissionStatus: "open",
        stylesOffered: ["", 123, " "],
        profilePictureUrl: "https://valid.url",
        city: "Austin",
        state: "TX",
        zipcode: "73301",
        currencyCode: "USD",
      })
    ).rejects.toThrow("All styles must be non-empty strings.");
  });

  it("throws error when stylesOffered exceeds max allowed styles", async () => {
    const tooManyStyles = Array.from({ length: 16 }, (_, i) => `Style${i}`);

    await expect(
      ArtistProfiles.create({
        userId: 3,
        displayName: "OverflowArtist",
        commissionStatus: "open",
        stylesOffered: tooManyStyles, // 🚫 >15
        profilePictureUrl: "https://valid.url",
        city: "Denver",
        state: "CO",
        zipcode: "80014",
        currencyCode: "USD",
      })
    ).rejects.toThrow("Cannot list more than 15 styles.");
  });

  it("location setter uses ST_SetSRID with lng/lat", () => {
    const instance = ArtistProfiles.build();

    instance.setDataValue = jest.fn();

    instance.location = { lat: 47.61, lng: -122.33 };

    expect(instance.setDataValue).toHaveBeenCalledWith(
      "location",
      expect.objectContaining({
        fn: "ST_SetSRID",
      })
    );
  });

  test("location getter returns coordinates if location is set", () => {
    const instance = ArtistProfiles.build();
    instance.getDataValue = jest.fn().mockReturnValue({
      coordinates: [-122.33, 47.61],
    });

    const coords = instance.location;
    expect(coords).toEqual([-122.33, 47.61]);
  });

  test("location getter returns null if location is not set", () => {
    const instance = ArtistProfiles.build();
    instance.getDataValue = jest.fn().mockReturnValue(null);

    const coords = instance.location;
    expect(coords).toBeNull();
  });
});
