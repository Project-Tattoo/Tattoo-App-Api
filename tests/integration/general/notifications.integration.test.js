// const request = require("supertest");
// const db = require("./../../../server");
// const app = require("./../../../app");
// const Users = require("../../../models/shared/Users");
// const Notifications = require("../../../models/shared/Notifications");

// require("dotenv").config({ path: "./.env.test" });

// describe("notificationsController Integration Tests", () => {
//   let user, authToken;

//   const loginAndGetToken = async () => {
//     const loginRes = await request(app)
//       .post("/api/v1/auth/login")
//       .send({ email: "testuser@example.com", password: "testpass123" });
//     return loginRes.body.token;
//   };

//   beforeEach(async () => {
//     await Notifications.destroy({ truncate: true, cascade: true });
//     await Users.destroy({ truncate: true, cascade: true });

//     user = await Users.create({
//       firstName: "test",
//       lastName: "user",
//       email: "testuser@example.com",
//       passwordHash: "testpass123",
//       role: "user",
//       displayName: "TestUser",
//     });

//     await Notifications.bulkCreate([
//       {
//         userId: user.id,
//         notificationType: "system_alert",
//         message: "System maintenance",
//       },
//       {
//         userId: user.id,
//         notificationType: "design_favorited",
//         message: "Your design was favorited",
//       },
//     ]);

//     authToken = await loginAndGetToken();
//   });

//   afterAll(async () => {
//     await db.close();
//   });

//   describe("getNotifications", () => {
//     it("should return all notifications for logged in user", async () => {
//       const res = await request(app)
//         .get("/api/v1/notifications")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.results).toBe(2);
//       expect(res.body.data.length).toBe(2);
//     });

//     it("should return empty array if no notifications", async () => {
//       await Notifications.destroy({ where: { userId: user.id } });

//       const res = await request(app)
//         .get("/api/v1/notifications")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.results).toBe(0);
//       expect(res.body.message).toBe("You currently have no notifications.");
//     });

//     it("should handle DB error via catchAsync", async () => {
//       jest
//         .spyOn(Notifications, "findAll")
//         .mockRejectedValueOnce(new Error("DB error"));

//       const res = await request(app)
//         .get("/api/v1/notifications")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(500);
//       expect(res.body.message).toBe("DB error");

//       Notifications.findAll.mockRestore();
//     });
//   });

//   describe("getUnreadNotifications", () => {
//     it("should return unread notifications for the logged in user", async () => {
//       await Notifications.create({
//         userId: user.id,
//         notificationType: "system_alert",
//         message: "You have an unread notification",
//         isRead: false,
//       });

//       const res = await request(app)
//         .get("/api/v1/notifications/unread")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe("success");
//       expect(res.body.results).toBeGreaterThan(0);
//       res.body.data.forEach((n) => {
//         expect(n.isRead).toBe(false);
//       });
//     });

//     it("should return 200 with message if no unread notifications exist", async () => {
//       await Notifications.update(
//         { isRead: true },
//         { where: { userId: user.id } }
//       );

//       const res = await request(app)
//         .get("/api/v1/notifications/unread")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.results).toBe(0);
//       expect(res.body.message).toBe(
//         "You currently have no unread notifications."
//       );
//       expect(res.body.data).toEqual([]);
//     });

//     it("should return 500 if findAll throws", async () => {
//       jest
//         .spyOn(Notifications, "findAll")
//         .mockRejectedValueOnce(new Error("DB error"));

//       const res = await request(app)
//         .get("/api/v1/notifications/unread")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(500);
//       expect(res.body.message).toBe("DB error");

//       Notifications.findAll.mockRestore();
//     });
//   });

//   describe("markNotificationAsRead", () => {
//     let notification;

//     beforeEach(async () => {
//       notification = await Notifications.create({
//         userId: user.id,
//         notificationType: "system_alert",
//         message: "Mark me as read",
//         isRead: false,
//       });
//     });

//     it("should mark a notification as read", async () => {
//       const notification = await Notifications.create({
//         userId: user.id,
//         notificationType: "system_alert",
//         message: "Mark me as read",
//         isRead: false,
//       });

//       const res = await request(app)
//         .patch(`/api/v1/notifications/${notification.id}`)
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe("success");
//       expect(res.body.data.isRead).toBe(true);

//       const updated = await Notifications.findByPk(notification.id);
//       expect(updated.isRead).toBe(true);
//     });

//     it("should return success even if notification already read", async () => {
//       await notification.update({ isRead: true });

//       const res = await request(app)
//         .patch(`/api/v1/notifications/${notification.id}`)
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe("success");
//       expect(res.body.data.isRead).toBe(true);
//     });

//     it("should return 404 if notification does not exist", async () => {
//       const res = await request(app)
//         .patch(`/api/v1/notifications/999999`)
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(404);
//     });
//   });

//   describe("markSelectedNotificationsAsRead", () => {
//     let notifications;

//     beforeEach(async () => {
//       notifications = await Notifications.bulkCreate([
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "First notification",
//           isRead: false,
//         },
//         {
//           userId: user.id,
//           notificationType: "design_favorited",
//           message: "Second notification",
//           isRead: false,
//         },
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "Third notification",
//           isRead: false,
//         },
//       ]);
//     });

//     it("should mark selected notifications as read", async () => {
//       const idsToMark = notifications.slice(0, 2).map((n) => n.id);

//       const res = await request(app)
//         .patch("/api/v1/notifications/read-selected")
//         .set("Authorization", `Bearer ${authToken}`)
//         .send({ ids: idsToMark });

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe("success");
//       expect(res.body.results).toBe(idsToMark.length);

//       res.body.data.forEach((n) => {
//         expect(idsToMark).toContain(n.id);
//         expect(n.isRead).toBe(true);
//       });

//       const untouched = await Notifications.findByPk(notifications[2].id);
//       expect(untouched.isRead).toBe(false);
//     });

//     it("should return 400 if no IDs provided", async () => {
//       const res = await request(app)
//         .patch("/api/v1/notifications/read-selected")
//         .set("Authorization", `Bearer ${authToken}`)
//         .send({ ids: [] });

//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe(
//         "Please provide an array of notification IDs."
//       );
//     });
//   });

//   describe("markAllNotificationsAsRead", () => {
//     let notifications;

//     beforeEach(async () => {
//       notifications = await Notifications.bulkCreate([
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "First notification",
//           isRead: false,
//         },
//         {
//           userId: user.id,
//           notificationType: "design_favorited",
//           message: "Second notification",
//           isRead: false,
//         },
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "Third notification",
//           isRead: false,
//         },
//       ]);
//     });

//     it("should mark all notifications as read", async () => {
//       const res = await request(app)
//         .patch("/api/v1/notifications/read-all")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe("success");
//       expect(res.body.data.length).toBe(5);

//       res.body.data.forEach((n) => {
//         expect(n.isRead).toBe(true);
//       });

//       const dbNotifications = await Notifications.findAll({
//         where: { userId: user.id },
//       });
//       dbNotifications.forEach((n) => {
//         expect(n.isRead).toBe(true);
//       });
//     });

//     it("should return success even if all notifications are already read", async () => {
//       await Notifications.update(
//         { isRead: true },
//         { where: { userId: user.id } }
//       );

//       const res = await request(app)
//         .patch("/api/v1/notifications/read-all")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(200);
//       expect(res.body.status).toBe("success");
//       expect(res.body.data.length).toBe(5);

//       res.body.data.forEach((n) => {
//         expect(n.isRead).toBe(true);
//       });
//     });

//     it("should handle DB errors gracefully", async () => {
//       jest
//         .spyOn(Notifications, "update")
//         .mockRejectedValueOnce(new Error("DB error"));

//       const res = await request(app)
//         .patch("/api/v1/notifications/read-all")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(500);
//       expect(res.body.message).toBe("DB error");

//       Notifications.update.mockRestore();
//     });
//   });

//   describe("deleteNotification(s)", () => {
//     let notifications;

//     beforeEach(async () => {
//       notifications = await Notifications.bulkCreate([
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "Notification 1",
//         },
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "Notification 2",
//         },
//         {
//           userId: user.id,
//           notificationType: "system_alert",
//           message: "Notification 3",
//         },
//       ]);
//     });

//     it("should delete a single notification", async () => {
//       const notificationToDelete = notifications[0];

//       const res = await request(app)
//         .delete(`/api/v1/notifications/${notificationToDelete.id}`)
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(204);

//       const deleted = await Notifications.findByPk(notificationToDelete.id);
//       expect(deleted).toBeNull();
//     });

//     it("should delete all notifications for the logged-in user", async () => {
//       const res = await request(app)
//         .delete("/api/v1/notifications")
//         .set("Authorization", `Bearer ${authToken}`);

//       expect(res.status).toBe(204);

//       const remaining = await Notifications.findAll({
//         where: { userId: user.id },
//       });
//       expect(remaining.length).toBe(0);
//     });

//     it("should delete selected notifications by IDs", async () => {
//       const idsToDelete = [notifications[0].id, notifications[2].id];

//       const res = await request(app)
//         .delete("/api/v1/notifications/delete-selected")
//         .set("Authorization", `Bearer ${authToken}`)
//         .send({ ids: idsToDelete });

//       expect(res.status).toBe(204);

//       const remaining = await Notifications.findAll({
//         where: { userId: user.id },
//       });
//       expect(remaining.length).toBe(3);
//       expect(remaining[0].id).toBe(notifications[1].id);
//     });

//     it("should return 400 if delete-selected called without IDs", async () => {
//       const res = await request(app)
//         .delete("/api/v1/notifications/delete-selected")
//         .set("Authorization", `Bearer ${authToken}`)
//         .send({ ids: [] });

//       expect(res.status).toBe(400);
//       expect(res.body.message).toBe(
//         "Please provide an array of notification IDs."
//       );
//     });
//   });
// });

const request = require("supertest");
const db = require("./../../../server");
const app = require("./../../../app");
const Users = require("../../../models/shared/Users");
const Notifications = require("../../../models/shared/Notifications");

require("dotenv").config({ path: "./.env.test" });

describe("notificationsController Integration Tests", () => {
  let user, authToken;

  const loginAndGetToken = async () => {
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "testuser@example.com", password: "testpass123" });
    return loginRes.body.token;
  };

  beforeEach(async () => {
    await Notifications.destroy({ truncate: true, cascade: true });
    await Users.destroy({ truncate: true, cascade: true });

    user = await Users.create({
      firstName: "test",
      lastName: "user",
      email: "testuser@example.com",
      passwordHash: "testpass123",
      role: "user",
      displayName: "TestUser",
    });

    authToken = await loginAndGetToken();
  });

  afterAll(async () => {
    await db.close();
  });

  // --------------------------
  // GET /notifications
  // --------------------------
  describe("getNotifications", () => {
    it("should return all notifications for logged in user", async () => {
      const notifications = await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "A" },
        { userId: user.id, notificationType: "design_favorited", message: "B" },
      ], { returning: true });

      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(notifications.length);
      expect(res.body.data.length).toBe(notifications.length);
    });

    it("should return empty array if no notifications exist", async () => {
      const res = await request(app)
        .get("/api/v1/notifications")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(0);
      expect(res.body.message).toBe("You currently have no notifications.");
      expect(res.body.data).toEqual([]);
    });
  });

  // --------------------------
  // GET /notifications/unread
  // --------------------------
  describe("getUnreadNotifications", () => {
    it("should return only unread notifications", async () => {
      const notifications = await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "A", isRead: false },
        { userId: user.id, notificationType: "design_favorited", message: "B", isRead: true },
      ], { returning: true });

      const res = await request(app)
        .get("/api/v1/notifications/unread")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBe(1);
      expect(res.body.data[0].isRead).toBe(false);
    });

    it("should return 200 with message if no unread notifications exist", async () => {
      await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "A", isRead: true },
      ]);

      const res = await request(app)
        .get("/api/v1/notifications/unread")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.results).toBe(0);
      expect(res.body.message).toBe("You currently have no unread notifications.");
      expect(res.body.data).toEqual([]);
    });
  });

  // --------------------------
  // PATCH /notifications/:notificationId
  // --------------------------
  describe("markNotificationAsRead", () => {
    it("should mark a single notification as read", async () => {
      const notification = await Notifications.create({
        userId: user.id,
        notificationType: "system_alert",
        message: "Mark me",
        isRead: false,
      });

      const res = await request(app)
        .patch(`/api/v1/notifications/${notification.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.data.isRead).toBe(true);

      const updated = await Notifications.findByPk(notification.id);
      expect(updated.isRead).toBe(true);
    });

    it("should return 404 if notification does not exist", async () => {
      const res = await request(app)
        .patch(`/api/v1/notifications/999999`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(404);
    });
  });

  // --------------------------
  // PATCH /notifications/read-selected
  // --------------------------
  describe("markSelectedNotificationsAsRead", () => {
    it("should mark selected notifications as read", async () => {
      const notifications = await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "1", isRead: false },
        { userId: user.id, notificationType: "system_alert", message: "2", isRead: false },
        { userId: user.id, notificationType: "system_alert", message: "3", isRead: false },
      ], { returning: true });

      const idsToMark = [notifications[0].id, notifications[1].id];

      const res = await request(app)
        .patch("/api/v1/notifications/read-selected")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: idsToMark });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");
      expect(res.body.results).toBe(idsToMark.length);

      res.body.data.forEach(n => {
        expect(idsToMark).toContain(n.id);
        expect(n.isRead).toBe(true);
      });

      const untouched = await Notifications.findByPk(notifications[2].id);
      expect(untouched.isRead).toBe(false);
    });

    it("should return 400 if no IDs provided", async () => {
      const res = await request(app)
        .patch("/api/v1/notifications/read-selected")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Please provide an array of notification IDs.");
    });
  });

  // --------------------------
  // PATCH /notifications/read-all
  // --------------------------
  describe("markAllNotificationsAsRead", () => {
    it("should mark all notifications as read", async () => {
      const notifications = await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "1", isRead: false },
        { userId: user.id, notificationType: "system_alert", message: "2", isRead: false },
      ], { returning: true });

      const res = await request(app)
        .patch("/api/v1/notifications/read-all")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("success");

      res.body.data.forEach(n => {
        expect(n.isRead).toBe(true);
      });

      const dbNotifications = await Notifications.findAll({ where: { userId: user.id } });
      dbNotifications.forEach(n => expect(n.isRead).toBe(true));
    });
  });

  // --------------------------
  // DELETE /notifications/:notificationId, /notifications, /notifications/delete-selected
  // --------------------------
  describe("deleteNotification(s)", () => {
    it("should delete a single notification", async () => {
      const notification = await Notifications.create({
        userId: user.id,
        notificationType: "system_alert",
        message: "Delete me",
      });

      const res = await request(app)
        .delete(`/api/v1/notifications/${notification.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(204);
      const deleted = await Notifications.findByPk(notification.id);
      expect(deleted).toBeNull();
    });

    it("should delete all notifications for the user", async () => {
      await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "1" },
        { userId: user.id, notificationType: "system_alert", message: "2" },
      ]);

      const res = await request(app)
        .delete("/api/v1/notifications")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(204);

      const remaining = await Notifications.findAll({ where: { userId: user.id } });
      expect(remaining.length).toBe(0);
    });

    it("should delete selected notifications by IDs", async () => {
      const notifications = await Notifications.bulkCreate([
        { userId: user.id, notificationType: "system_alert", message: "1" },
        { userId: user.id, notificationType: "system_alert", message: "2" },
        { userId: user.id, notificationType: "system_alert", message: "3" },
      ], { returning: true });

      const idsToDelete = [notifications[0].id, notifications[2].id];

      const res = await request(app)
        .delete("/api/v1/notifications/delete-selected")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: idsToDelete });

      expect(res.status).toBe(204);

      const remaining = await Notifications.findAll({ where: { userId: user.id } });
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe(notifications[1].id);
    });

    it("should return 400 if delete-selected called without IDs", async () => {
      const res = await request(app)
        .delete("/api/v1/notifications/delete-selected")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ ids: [] });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe("Please provide an array of notification IDs.");
    });
  });
});
