const { DataTypes } = require("sequelize");
const db = require("./../../server");
const Users = require("./../shared/Users");

const FavoriteArtists = db.define(
  "favoriteArtists",
  {
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to a profile",
        },
      },
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    artistId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A favorite must be linked to an artists profile",
        },
      },
      references: {
        model: Users,
        key: "id",
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
        fields: ["userId", "artistId"],
        name: "unique_user_artist_favorite",
      },
      { fields: ["userId"], name: "favorite_artists_users_id_idx" },
      { fields: ["artistId"], name: "user_favorite_artists_artist_id_idx" },
      {
        fields: ["favoritedAt"],
        name: "users_favorite_artists_favorited_at_idx",
      },
    ],
    hooks: {
      afterCreate: async(favorite, options) => {
        await Users.increment("totalFollowers", {
          where: {id: favorite.artistId},
          transaction: options.transaction
        })
      },
      afterDestroy: async(favorite, options) => {
        await Users.decrement("totalFollowers", {
          where: {id: favorite.artistId},
          transaction: options.transaction
        })
      }
    }
  }
);

module.exports = FavoriteArtists;
