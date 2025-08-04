const TattooDesigns = require("./../../../../models/artists/TattooDesigns");

describe("tatooDesigns model", () => {
  describe("tags custom validator", () => {
    it("should throw if tags is not an array", async () => {
      const invalid = TattooDesigns.build({ tags: "not-an-array" });
      await expect(invalid.validate()).rejects.toThrow(
        "Tags must be an array."
      );
    });

    it("should throw if any tag is not a string", async () => {
      const invalid = TattooDesigns.build({ tags: ["valid", 123] });
      await expect(invalid.validate()).rejects.toThrow(
        "All tags must be non-empty strings."
      );
    });

    it("should throw if any tag is an empty string", async () => {
      const invalid = TattooDesigns.build({ tags: ["", "linework"] });
      await expect(invalid.validate()).rejects.toThrow(
        "All tags must be non-empty strings."
      );
    });

    it("should throw if any tag is whitespace only", async () => {
      const invalid = TattooDesigns.build({ tags: ["   ", "dotwork"] });
      await expect(invalid.validate()).rejects.toThrow(
        "All tags must be non-empty strings."
      );
    });

    it("throws error when tags contain empty or non-string items", async () => {
      await expect(
        TattooDesigns.create({
          title: "Some Design",
          description: "Cool piece",
          price: 150,
          tags: ["", 123, " "],
          artistId: 1,
          imageUrl: "https://example.com/tattoo.jpg",
        })
      ).rejects.toThrow("All tags must be non-empty strings.");
    });
  });
});
