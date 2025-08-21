const express = require("express");
const authController = require("./../../controllers/shared/authController");
const notificationsController = require("./../../controllers/shared/notificationController");

const notificationsRouter = express.Router();

notificationsRouter
  .route("/")
  .get(authController.protect, notificationsController.getNotifications)
  .delete(
    authController.protect,
    notificationsController.deleteAllNotifications
  );
notificationsRouter
  .route("/unread")
  .get(authController.protect, notificationsController.getUnreadNotifications);
notificationsRouter
  .route("/read-all")
  .patch(
    authController.protect,
    notificationsController.markAllNotificationsAsRead
  );
notificationsRouter
  .route("/read-selected")
  .patch(
    authController.protect,
    notificationsController.markSelectedNotificationsAsRead
  );
notificationsRouter
  .route("/delete-selected")
  .delete(
    authController.protect,
    notificationsController.deleteSelectedNotifications
  );
notificationsRouter
  .route("/:notificationId")
  .patch(authController.protect, notificationsController.markNotificationAsRead)
  .delete(authController.delete, notificationsController.deleteNotification);

module.exports = notificationsRouter;
