const { DataTypes } = require("sequelize");
import { define } from "./../../server";
import ClientProfiles from "./ClientProfiles";
import ArtistProfiles from "./../artists/ArtistProfiles";

const ClientFavoriteArtists = define(
  "clientFavoriteArtists",
  {
    clientId: {
      type: DataTypes.INTEGER,
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
      type: DataTypes.INTEGER,
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
      type: DataTypes.DATEONLY,
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
      },
      {
        fields: ["clientId"], 
        name: "idx_client_favorite_artists_by_client_id",
      },
      {
        fields: ["artistId"],
        name: "idx_client_favorite_artists_by_artist_id",
      },
    ],
  }
);

module.exports = ClientFavoriteArtists;
