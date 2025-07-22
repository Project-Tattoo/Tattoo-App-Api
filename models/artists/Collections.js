const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ArtistProfiles = require("./ArtistProfiles");

const Collections = db.define(
  "collections",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    publicId: { 
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, 
      unique: true, 
      allowNull: false,
    },
    artistId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A collection must be linked to an artist",
        },
      },
      references: {
        model: ArtistProfiles,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A collection must have a name",
        },
        len: {
          args: [3, 100],
          msg: "Collection name must be between 3 and 100 characters.",
        },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: {
          args: [0, 500],
          msg: "Description cannot exceed 500 characters.",
        },
      },
    },
  },
  { timestamps: true }
);

module.exports = Collections;
