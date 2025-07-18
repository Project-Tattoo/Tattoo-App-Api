const Sequelize = require("sequelize");
const db = require("./../../server");
const Users = require("./../shared/Users");

const ClientProfiles = db.define("clientProfiles", {
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
    onDelete: "CASCADE",
  },
  displayName: {
    type: Sequelize.TEXT,
    allowNull: false,
    unique: true,
    validate: {
      notNull: {
        msg: "Must provide a display name",
      },
      len: {
        args: [3, 50],
        msg: "Display name must be between 3 and 50 characters.",
      },
    },
  },
  bio: {
    type: Sequelize.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: "Bio cannot exceed 1000 characters.",
      },
    },
  },
}, {timestamps: true});

module.exports = ClientProfiles