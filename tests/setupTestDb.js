const db = require('./../server'); 

require('./../models/shared/Users');
require('./../models/shared/EmailPreferences');
require('./../models/shared/TOSAgreement');
require('./../models/artists/ArtistProfiles');
require('./../models/artists/VerificationApplications');
require('./../models/artists/TattooDesigns');
require('./../models/artists/Collections');
require('./../models/artists/CollectionDesigns');
require('./../models/artists/CommissionListing');
require('./../models/clients/ClientProfiles');
require('./../models/clients/ClientFavoriteDesigns');
require('./../models/clients/ClientFavoriteArtists');
require('./../models/shared/CommissionOrders');
require('./../models/shared/CommissionReviews');
require('./../models/analytics/SuggestedStyles');

require('./../models/associations'); 

async function connectToTestDB() {
  console.log('Connecting to test database...');
  console.log(db.config.host)
  console.log(db.config.port)
  console.log(db.config.database)
  try {
    await db.authenticate();
    console.log('Test database connection established.');
    console.log('Synchronizing models with test database (force: true)...');
    await db.sync({ force: true });
    console.log('Test database synchronized successfully.');

  } catch (error) {
    console.error('Failed to connect or sync test database:', error);
    process.exit(1);
  }
}

async function closeTestDB() {
  console.log('Closing test database connection...');
  try {
    await db.close();
    console.log('Test database connection closed.');
  } catch (error) {
    console.error('Error closing test database connection:', error);
    process.exit(1); 
  }
}


module.exports = { connectToTestDB, closeTestDB };
