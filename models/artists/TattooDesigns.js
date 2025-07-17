const Sequelize = require("sequelize");
const db = require("./../../server");
const ArtistProfiles = require("./ArtistProfiles");

const TattooDesigns = db.define(
  "tattooDesigns",
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
    },
    title: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have a title",
        },
      },
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    imageUrl: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have an image",
        },
      },
    },
    thumbnailUrl: {
      type: Sequelize.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A design must have a thumbnail image",
        },
      },
    },
    tags: {
      type: Sequelize.ARRAY(Sequelize.TEXT),
      allowNull: true,
    },
    style: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  },
  { timestamps: true }
);

module.exports = TattooDesigns