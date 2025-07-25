const express = require("express");
const authController = require("./../controllers/authController");
const Users = require("./../models/shared/Users"); 

const authRouter = express.Router();

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.get("/validate-token", authController.validateToken);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.get("/logout", (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully." });
});
router.use(authController.protect(Users));
router.post("/requestPasswordChange", authController.requestPasswordChange);
router.patch("/updatePassword", authController.updatePassword);

module.exports = authRouter;
