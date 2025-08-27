const { DataTypes } = require("sequelize");
const db = require("./../../server");
const Users = require("./Users");

const Notifications = db.define(
  "notifications",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      allowNull: false,
      validate: {
        notNull: {
          msg: "A notification must be linked to a user",
        },
      },
      references: {
        model: Users,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    notificationType: {
      type: DataTypes.ENUM(
        "new_message",
        "commission_received",
        "commission_completed",
        "commission_status_update",
        "design_favorited",
        "profile_favorited",
        "commission_order_placed",
        "system_alert"
      ),
      defaultValue: "system_alert",
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [{ fields: ["userId"], name: "notifications_user_id_idx" }],
  }
);

module.exports = Notifications;
