const db = require("./../server");

require("./../models/shared/Users");
require("./../models/shared/EmailPreferences");
require("./../models/shared/TOSAgreement");
require("./../models/artists/ArtistProfiles");
require("./../models/artists/VerificationApplications");
require("./../models/artists/TattooDesigns");
require("./../models/artists/PortfolioCollections");
require("./../models/artists/CollectionDesigns");
require("./../models/artists/CommissionListing");
require("./../models/clients/ClientProfiles");
require("./../models/clients/ClientFavoriteDesigns");
require("./../models/clients/ClientFavoriteArtists");
require("./../models/shared/CommissionOrders");
require("./../models/shared/CommissionReviews");
require("./../models/shared/SuggestedStyles");
require("./../models/shared/Notifications");
require("./../models/shared/CommissionArtworks");
require("./../models/associations");

(async () => {
  try {
    await db.authenticate();
    console.log("Database connection has been established successfully.");
    await db.sync({ force: true });
    console.log("All models were synchronized successfully (force: true).");

    process.exit(0);
  } catch (error) {
    console.error("Error syncing models:", error);
    process.exit(1);
  }
})();
