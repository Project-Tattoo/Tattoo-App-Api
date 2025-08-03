const express = require("express");
const authController = require("./../../controllers/general/authController");
const Users = require("./../../models/shared/Users"); 

const authRouter = express.Router();

authRouter.post("/signup", authController.signup);
authRouter.post("/login", authController.login);
authRouter.get("/validate-token", authController.validateToken);
authRouter.post("/forgotPassword", authController.forgotPassword);
authRouter.patch("/resetPassword", authController.resetPassword);
authRouter.get("/logout", (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  res
    .status(200)
    .json({ status: "success", message: "Logged out successfully." });
});
authRouter.use(authController.protect(Users));
authRouter.post("/requestPasswordChange", authController.requestPasswordChange);
authRouter.patch("/updatePassword", authController.updatePassword);

module.exports = authRouter;
