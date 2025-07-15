const db = require("./../server");

(async () => {
    try {
      await db.authenticate();
      console.log("Database connection has been established successfully.");
  
      await db.sync({ force: true });
      console.log("All models were synchronized successfully");
  
      process.exit(0);
    } catch (error) {
      console.error("Error syncing models:", error);
      process.exit(1);
    }
  })();