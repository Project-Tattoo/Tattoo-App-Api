const { Sequelize } = require("sequelize");
const db = require("./../../server");
const AppError = require("../../utils/appError");
const catchAsync = require("./../../utils/catchAsync");
const Notifications = require("./../../models/shared/Notifications");

exports.getNotifications = catchAsync(async (req, res, next) => {
  const where = { userId: req.user.id };

  if (req.query.type) {
    where.notificationType = req.query.type;
  }

  const notifications = await Notifications.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  if (notifications.length === 0) {
    res.status(200).json({
      status: "success",
      results: 0,
      message: "You currently have no notifications.",
      data: [],
    });
  }

  res.status(200).json({
    status: "success",
    results: notifications.length,
    data: notifications,
  });
});

exports.getUnreadNotifications = catchAsync(async (req, res, next) => {
  const unreadNotifications = await Notifications.findAll({
    where: { userId: req.user.id, isRead: false },
    order: [["createdAt", "DESC"]],
  });

  if (unreadNotifications.length === 0) {
    res.status(200).json({
      status: "success",
      results: 0,
      message: "You currently have no unread notifications.",
      data: [],
    });
  }

  res.status(200).json({
    status: "success",
    results: unreadNotifications.length,
    data: unreadNotifications,
  });
});

exports.markNotificationAsRead = catchAsync(async (req, res, next) => {
  console.log(`\n\n\n\n\n notification id ${req.params.notificationId}`)
  const notification = await Notifications.findByPk(req.params.notificationId);

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  await notification.update({ isRead: true });

  res.status(200).json({
    status: "success",
    data: notification,
  });
});


exports.markSelectedNotificationsAsRead = catchAsync(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(
      new AppError("Please provide an array of notification IDs.", 400)
    );
  }

  await Notifications.update(
    { isRead: true },
    { where: { id: ids, userId: req.user.id } }
  );

  const updatedNotifications = await Notifications.findAll({
    where: { id: ids, userId: req.user.id },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    results: updatedNotifications.length,
    data: updatedNotifications,
  });
});

exports.markAllNotificationsAsRead = catchAsync(async (req, res, next) => {
  await Notifications.update(
    { isRead: true },
    { where: { userId: req.user.id, isRead: false } }
  );

  const updatedNotifications = await Notifications.findAll({
    where: { userId: req.user.id },
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({
    status: "success",
    data: updatedNotifications,
  });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  await Notifications.destroy({ where: { id: req.params.notificationId } });

  res
    .status(204)
    .json({ status: "success", message: "Notification successfully deleted" });
});

exports.deleteAllNotifications = catchAsync(async (req, res, next) => {
  await Notifications.destroy({ where: { userId: req.user.id } });

  res.status(204).json({
    status: "success",
    message: "All notifications successfully deleted",
  });
});

exports.deleteSelectedNotifications = catchAsync(async (req, res, next) => {
  const { ids } = req.body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return next(
      new AppError("Please provide an array of notification IDs.", 400)
    );
  }

  await Notifications.destroy({ where: { id: ids, userId: req.user.id } });

  res.status(204).json({
    status: "success",
    message: `${ids.length} notification(s) successfully deleted`,
  });
});
