const Sequelize = require("sequelize");
const db = require("./../../server");
const Users = require("./../shared/Users");

const ArtistProfiles = db.define(
  "artistProfiles",
  {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "An profile must be linked to a user account",
        },
      },
      references: {
        model: Users,
        key: "id",
      },
    },
    displayName: {
      type: Sequelize.TEXT,
      allowNull: false,
      unique: true,
      validate: {
        notNull: {
          msg: "Must provide a display name",
        },
      },
    },
    bio: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    commissionStatus: {
      type: Sequelize.ENUM("open", "closed", "byRequest"),
      allowNull: false,
      defaultValue: "closed",
      validate: {
        notNull: {
          msg: "Commission status is required.",
        },
        isIn: {
          args: [["open", "closed", "byRequest"]],
          msg: "Invalid commission status. Must be 'open', 'closed', or 'byRequest'.",
        },
      },
    },
    paymentPlatformId: {
      type: Sequelize.TEXT,
      allowNull: true,
      unique: true,
    },
    socialMediaLinks: {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    profilePictureUrl: {
      type: Sequelize.TEXT,
      allowNull: false,
      defaultValue: "www.defaultpfp.com",
    },
    city: {
      type: Sequelize.STRING,
      required: true,
      allowNull: false,
    },
    state: {
      type: Sequelize.STRING,
      required: true,
      allowNull: false,
    },
    zipcode: {
      type: Sequelize.STRING,
      required: true,
      allowNull: false,
    },
    location: {
      type: Sequelize.GEOGRAPHY("POINT"),
      allowNull: true,
      get() {
        const value = this.getDataValue("location");
        return value ? value.coordinates : null;
      },
      set(value) {
        this.setDataValue(
          "location",
          Sequelize.fn(
            "ST_SetSRID",
            Sequelize.fn("ST_MakePoint", value.lng, value.lat),
            4326
          )
        );
      },
    },
    isVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
    },
    // currentVerificationApplicationId: {
    // compelte later, once model is compelte
    // },
    totalCommissionsCompleted: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    totalRevenueEarned: {
        type: Sequelize.NUMBER,
        defaultValue: 0.0
    },
    currencyCode: {
        type: Sequelize.STRING,
        defaultValue: "USD"
    },
    averageRating: {
        type: Sequelize.NUMBER,
        defaultValue: 0.0
    }
  },
  { timestamps: true }
);

module.exports = ArtistProfiles;
