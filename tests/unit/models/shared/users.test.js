const Users = require("./../../../../models/shared/Users");

describe("users model", () => {
  describe("hooks", () => {
    it("does not hash password if passwordHash is not changed", async () => {
      const user = await Users.create({
        firstName: "tests",
        lastName: "userson",
        email: "static@example.com",
        passwordHash: "unchanged-password",
        role: "user",
        displayName:"passwordhashuser"
      });

      const originalHash = user.passwordHash;

      user.email = "updated@example.com";
      await user.save();

      expect(user.passwordHash).toBe(originalHash);
    });
  });

  describe("changedPasswordAfter(JWTTimtestamp)", () => {
    it("returns false if passwordChangedAt is not set", () => {
      const user = Users.build();
      expect(user.changedPasswordAfter(Date.now() / 1000)).toBe(false);
    });

    it("returns true if JWT was issued before password was changed", () => {
      const user = Users.build({
        passwordChangedAt: new Date(Date.now() - 5000),
      });
      const pastTimestamp = Math.floor(Date.now() / 1000) - 10;
      expect(user.changedPasswordAfter(pastTimestamp)).toBe(true);
    });

    it("returns false if JWT was issued after password change", () => {
      const user = Users.build({
        passwordChangedAt: new Date(Date.now() - 5000),
      });
      const futureTimestamp = Math.floor(Date.now() / 1000) + 10;
      expect(user.changedPasswordAfter(futureTimestamp)).toBe(false);
    });
  });

  describe("createPasswordResetToken", () => {
    it("creates and hashes password reset token", async () => {
      const user = Users.build();
      const token = await user.createPasswordResetToken();

      expect(typeof token).toBe("string");
      expect(token).toHaveLength(64);
      expect(user.passwordResetToken).not.toBe(token);
      expect(user.passwordResetExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("createVerifyToken", () => {
    it("creates and hashes verify token", async () => {
      const user = Users.build();
      const token = await user.createVerifyToken();

      expect(typeof token).toBe("string");
      expect(token).toHaveLength(64);
      expect(user.verifyToken).not.toBe(token);
      expect(user.verifyExpires.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe("verifyEmailToken(submittedToken)", () => {
    it("verifies valid email token", async () => {
      const user = Users.build();
      const token = await user.createVerifyToken();
      const isValid = await user.verifyEmailToken(token);
      expect(isValid).toBe(true);
    });

    it("throws error if token is expired", async () => {
      const user = Users.build({
        verifyExpires: Date.now() - 1000, // expired
      });
      const token = await user.createVerifyToken();
      user.verifyExpires = Date.now() - 1000;

      await expect(user.verifyEmailToken(token)).rejects.toThrow(
        "Token has expired"
      );
    });

    it("throws error if token is invalid", async () => {
      const user = Users.build();
      await user.createVerifyToken();

      await expect(user.verifyEmailToken("invalid-token")).rejects.toThrow(
        "InvalidToken"
      );
    });
  });
});
