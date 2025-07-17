const Sequelize = require("sequelize");
const db = require("./../../server");
const ArtistProfiles = require("./ArtistProfiles");

const CommissionListing = db.define(
  "commissionListings",
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    artistId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "An application must be linked to an artist",
        },
      },
      references: {
        model: ArtistProfiles,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    title: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have a title",
        },
        len: {
          args: [3, 100],
          msg: "Title must be between 3 and 100 characters.",
        },
      },
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 2000],
          msg: "Description cannot exceed 2000 characters.",
        },
      },
    },
    image: {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: "www.defaultcommissionimage.com",
      validate: {
        isUrl: { msg: "Image must be a valid URL." },
      },
    },
    basePrice: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        notNull: {
          msg: "A commission must have a price",
        },
        isDecimal: true,
        min: 0.01,
      },
    },
    estimatedTimeToCompletion: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Must provide a timeframe for completion",
        },
        min: 1,
        isInt: true,
      },
    },
    slotsAvailable: {
      type: Sequelize.INTEGER,
      allowNull: false,
      validate: {
        notNull: {
          msg: "Must provide a number of slots, if no longer accepting at this time, please set to zero or turn off commissions",
        },
        min: 0,
        isInt: true
      },
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
  },
  { timestamps: true }
);

module.exports = CommissionListing;
