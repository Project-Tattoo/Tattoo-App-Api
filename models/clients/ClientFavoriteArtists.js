const { DataTypes } = require("sequelize");
const db = require("./../../server");
const ClientProfiles = require("./ClientProfiles");
const ArtistProfiles = require("./../artists/ArtistProfiles");

const ClientFavoriteArtists = define(
  "clientFavoriteArtists",
  {
    clientId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to a client profile",
        },
      },
      references: {
        model: ClientProfiles,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    artistId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to an artist profile",
        },
      },
      references: {
        model: ArtistProfiles,
        key: "userId",
      },
      onDelete: "CASCADE",
    },
    favoritedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["clientId", "artistId"],
        name: "unique_client_artist_favorite",
      },
      { fields: ["clientId"], name: "client_favorite_artists_client_id_idx" },
      { fields: ["artistId"], name: "client_favorite_artists_artist_id_idx" },
      {
        fields: ["favoritedAt"],
        name: "client_favorite_artists_favorited_at_idx",
      },
    ],
  }
);

module.exports = ClientFavoriteArtists;
