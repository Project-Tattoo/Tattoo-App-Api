const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const authController = require("./../../../controllers/general/authController");
const AppError = require("../../../utils/appError");
const Users = require("../../../models/shared/Users");
const ClientProfiles = require("../../../models/clients/ClientProfiles");
const ArtistProfiles = require("../../../models/artists/ArtistProfiles");
const EmailPreference = require("../../../models/shared/EmailPreferences");
const TOSAgreement = require("../../../models/shared/TOSAgreement");
const db = require("../../../server");
const { Sequelize } = require("sequelize");
const mockSequelizeUniqueConstraintError = require("../../utils/mockSequelizeUniqueConstraintError");
const mockSequelizeValidationError = require("../../utils/mockSequelizeValidationError");
const { mockRequest, mockResponse } = require("./../../utils/mockExpress");

require("dotenv").config({ path: "./.env.test" });

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  return res;
};

const setupMockTransactionAndUser = () => {
  jest.spyOn(db, "transaction").mockImplementation(() => {
    return {
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    };
  });

  jest.spyOn(Users, "create").mockImplementation(async (data) => {
    const mockUser = {
      id: Math.floor(Math.random() * 1000) + 1,
      ...data,
      passwordHash: data.passwordHash || "mocked_hashed_password",
      toJSON: () => {
        const { passwordHash, ...rest } = mockUser;
        return rest;
      },
      save: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    };
    return mockUser;
  });

  jest.spyOn(EmailPreference, "create").mockResolvedValue({});
  jest.spyOn(TOSAgreement, "create").mockResolvedValue({});
  jest.spyOn(ArtistProfiles, "create").mockResolvedValue({});
  jest.spyOn(ClientProfiles, "create").mockResolvedValue({});
};

describe("Auth API Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    req = {
      body: {},
      ip: "127.0.0.1",
      headers: {},
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("signup", () => {
    it("should prevent signup with missing fields", async () => {
      const req = {
        body: {
          email: "test@example.com",
          password: "123456",
        },
        ip: "127.0.0.1",
      };
      const res = createMockResponse();
      const next = jest.fn();

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));

      const err = next.mock.calls[0][0];
      expect(err.message).toMatch(/Please provide email/);
      expect(err.statusCode).toBe(400);
    });

    it("should prevent registration with passwords that don't match", async () => {
      jest.spyOn(db, "transaction");

      const req = {
        body: {
          email: "test@example.com",
          password: "password123",
          passwordConfirm: "password1234",
          role: "client",
        },
        ip: "127.0.0.1",
      };
      const res = createMockResponse();
      const next = jest.fn();

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toContain(
        "Passwords do not match."
      );
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("should prevent registration of an admin role", async () => {
      const req = {
        body: {
          email: "admin@example.com",
          password: "password123",
          passwordConfirm: "password123",
          role: "admin",
        },
        ip: "127.0.0.1",
      };
      const res = createMockResponse();
      const next = jest.fn();

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/Admin accounts cannot be registered/);
      expect(error.statusCode).toBe(403);
    });

    it("should prevent registration with an invalid role", async () => {
      jest.spyOn(Users, "create");
      jest.spyOn(db, "transaction");
      const req = {
        body: {
          email: "invalidrole@example.com",
          password: "password123",
          passwordConfirm: "password123",
          role: "superuser",
        },
        ip: "127.0.0.1",
      };
      const res = createMockResponse();
      const next = jest.fn();

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));

      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/invalid user role/i);
      expect(error.statusCode).toBe(400);

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(Users.create).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("should prevent registration of an artist with missing required profile fields", async () => {
      const req = {
        body: {
          email: "artist@example.com",
          password: "password123",
          passwordConfirm: "password123",
          role: "artist",
        },
        ip: "127.0.0.1",
      };

      const res = createMockResponse();
      const next = jest.fn();

      jest.spyOn(Users, "create");
      jest.spyOn(db, "transaction");

      await authController.signup(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      expect(next.mock.calls[0][0].message).toMatch(
        /display name, city, state, and zipcode/
      );

      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();

      expect(Users.create).not.toHaveBeenCalled();
      expect(db.transaction).not.toHaveBeenCalled();
    });

    it("should handle a SequelizeUniqueConstraintError", async () => {
      const req = mockRequest({
        body: {
          email: "duplicate@example.com",
          password: "Password123!",
          passwordConfirm: "Password123!",
          role: "client",
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      await Users.create({
        email: "duplicate@example.com",
        passwordHash: "hashedpsddewor",
        role: "client",
        isActive: true,
        verifiedEmail: false,
      });

      await new Promise((resolve) => {
        authController.signup(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalled();

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toMatch(/duplicate@example\.com/);
      expect(error.statusCode).toBe(400);
    });

    it("should handle a SequelizeValidationError", async () => {
      const req = mockRequest({
        body: {
          email: "invalid-email",
          password: "Password123!",
          passwordConfirm: "Password123!",
          role: "client",
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      const error = mockSequelizeValidationError(["Email format is invalid."]);

      jest.spyOn(Users, "create").mockRejectedValue(error);

      await new Promise((resolve) => {
        authController.signup(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalled();

      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBeInstanceOf(AppError);
      expect(receivedError.message).toMatch(/Invalid input data: /);
      expect(receivedError.statusCode).toBe(400);
    });

    it("should handle a general error during transaction", async () => {
      const req = mockRequest({
        body: {
          email: "test@example.com",
          password: "Password123!",
          passwordConfirm: "Password123!",
          role: "client",
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      const generalError = new Error("Something went wrong");
      jest.spyOn(Users, "create").mockRejectedValue(generalError);

      await new Promise((resolve) => {
        authController.signup(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      await new Promise((resolve) => setImmediate(resolve));

      expect(next).toHaveBeenCalled();
      const receivedError = next.mock.calls[0][0];
      expect(receivedError).toBe(generalError);
    });
  });

  describe("login", () => {
    it("should prevent login if email or password is missing", async () => {
      const res = mockResponse();
      const next = jest.fn();

      const cases = [
        { email: "", password: "testpass" },
        { email: "test@example.com", password: "" },
        { email: "", password: "" },
        { email: null, password: "testpass" },
        { email: "test@example.com", password: null },
      ];

      for (const body of cases) {
        const req = mockRequest({ body });

        await new Promise((resolve) => {
          authController.login(req, res, (...args) => {
            next(...args);
            resolve();
          });
        });

        expect(next).toHaveBeenCalled();
        const err = next.mock.calls[next.mock.calls.length - 1][0];
        expect(err).toBeInstanceOf(AppError);
        expect(err.message).toMatch(/email and password/i);
        expect(err.statusCode).toBe(400);
      }
    });

    it("should mock a user not being found with provided credentials", async () => {
      const req = mockRequest({
        body: {
          email: "nonexistent@example.com",
          password: "somePassword123",
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      jest.spyOn(Users, "findOne").mockResolvedValue(null);

      await new Promise((resolve) => {
        authController.login(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      await new Promise((r) => setImmediate(r));

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/incorrect email or password/i);
      expect(err.statusCode).toBe(401);
    });

    it("should prevent login with an incorrect password", async () => {
      const req = mockRequest({
        body: {
          email: "valid@example.com",
          password: "wrongPassword123",
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      const mockUser = {
        id: 1,
        email: "valid@example.com",
        passwordHash: "hashedpassword",
        correctPassword: jest.fn().mockResolvedValue(false),
      };

      jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

      await new Promise((resolve) => {
        authController.login(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });
      await new Promise((r) => setImmediate(r));

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/incorrect email or password/i);
      expect(err.statusCode).toBe(401);
    });
  });

  describe("validateToken", () => {
    it("should reject when no token is provided", async () => {
      const req = mockRequest({
        headers: {},
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      await authController.validateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: "No token provided.",
      });
    });

    it("should mock jwt.verify to resolve provided token in headers", async () => {
      const fakeToken = "valid.header.payload";
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${fakeToken}`,
        },
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          callback(null, { id: 1 });
        });

      await authController.validateToken(req, res, next);
      await new Promise((resolve) => setImmediate(resolve));

      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        message: "Token is valid.",
      });

      jwt.verify.mockRestore();
    });

    it("should mock jwt.verify to resolve provided token in cookies", async () => {
      const fakeToken = "valid.header.payload";
      const req = mockRequest({
        headers: {},
        cookies: {
          jwt: fakeToken,
        },
      });
      const res = mockResponse();
      const next = jest.fn();

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          callback(null, { id: 1 });
        });

      await authController.validateToken(req, res, next);
      await new Promise((resolve) => setImmediate(resolve));

      expect(res.json).toHaveBeenCalledWith({
        valid: true,
        message: "Token is valid.",
      });

      jwt.verify.mockRestore();
    });

    it("should mock jwt.verify to reject with an error for expired or malformed tokens", async () => {
      const fakeToken = "invalid.token.payload";
      const req = mockRequest({
        headers: {
          authorization: `Bearer ${fakeToken}`,
        },
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          callback(new Error("Token is malformed or expired"));
        });

      await authController.validateToken(req, res, next);
      await new Promise((resolve) => setImmediate(resolve));

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        valid: false,
        message: "Invalid or expired token.",
      });

      jwt.verify.mockRestore();
    });
  });

  describe("protect", () => {
    it("should call AppError when a user is not logged in", async () => {
      const req = mockRequest({ headers: {}, cookies: {} });
      const res = mockResponse();
      const next = jest.fn();

      const protectMiddleware = authController.protect(Users);
      await protectMiddleware(req, res, next);

      const err = next.mock.calls[0][0];
      expect(next).toHaveBeenCalled();
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/not logged in/i);
      expect(err.statusCode).toBe(401);
    });

    it("should throw an error when verifying token if not logged in", async () => {
      const req = mockRequest({
        headers: {
          authorization: "Bearer invalid.token",
        },
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          setTimeout(() => {
            callback(new jwt.JsonWebTokenError("jwt malformed"));
          }, 0);
        });

      const protectMiddleware = authController.protect(Users);
      await new Promise((resolve) => {
        protectMiddleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(jwt.JsonWebTokenError);
      expect(err.message).toMatch(/jwt malformed/i);

      jwt.verify.mockRestore();
    });

    it("should mock Users.findByPk to return null after token is decoded", async () => {
      const req = mockRequest({
        headers: {
          authorization: "Bearer valid.token",
        },
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          setTimeout(() => {
            callback(null, { id: 999, iat: Date.now() / 1000 });
          }, 0);
        });

      const mockUsers = {
        findByPk: jest.fn().mockResolvedValue(null),
      };

      const protectMiddleware = authController.protect(mockUsers);
      await new Promise((resolve) => {
        protectMiddleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      expect(mockUsers.findByPk).toHaveBeenCalledWith(999);
      expect(next).toHaveBeenCalled();

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/no longer exists/i);
      expect(err.statusCode).toBe(401);

      jwt.verify.mockRestore();
    });

    it("should mock changedPasswordAfter a token has been issued, signaling to log in again", async () => {
      const req = mockRequest({
        headers: {
          authorization: "Bearer valid.token",
        },
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          setTimeout(() => {
            callback(null, {
              id: 123,
              iat: Math.floor(Date.now() / 1000) - 100,
            });
          }, 0);
        });

      const fakeUser = {
        changedPasswordAfter: jest.fn().mockResolvedValue(true),
      };

      const mockUsers = {
        findByPk: jest.fn().mockResolvedValue(fakeUser),
      };

      const protectMiddleware = authController.protect(mockUsers);
      await new Promise((resolve) => {
        protectMiddleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      expect(fakeUser.changedPasswordAfter).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();

      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/password has been changed/i);
      expect(err.statusCode).toBe(401);

      jwt.verify.mockRestore();
    });

    it("should mock a successful access into protected route", async () => {
      const req = mockRequest({
        headers: {
          authorization: "Bearer valid.token",
        },
        cookies: {},
      });
      const res = mockResponse();
      const next = jest.fn();

      const fakeUser = {
        id: 123,
        email: "user@example.com",
        changedPasswordAfter: jest.fn().mockResolvedValue(false),
      };

      jest
        .spyOn(jwt, "verify")
        .mockImplementation((token, secret, callback) => {
          setTimeout(() => {
            callback(null, {
              id: fakeUser.id,
              iat: Math.floor(Date.now() / 1000) - 100,
            });
          }, 0);
        });

      const mockUsers = {
        findByPk: jest.fn().mockResolvedValue(fakeUser),
      };

      const protectMiddleware = authController.protect(mockUsers);

      await new Promise((resolve) => {
        protectMiddleware(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      expect(jwt.verify).toHaveBeenCalled();
      expect(mockUsers.findByPk).toHaveBeenCalledWith(fakeUser.id);
      expect(fakeUser.changedPasswordAfter).toHaveBeenCalled();
      expect(req.user).toBe(fakeUser);
      expect(res.locals.user).toBe(fakeUser);
      expect(next).toHaveBeenCalledWith();

      jwt.verify.mockRestore();
    });
  });

  describe("restrictTo", () => {
    it("should throw next AppError when req.user is not set", () => {
      const req = {};
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authController.restrictTo("artist");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/permission/i);
    });

    it("should throw next AppError when a client tries to access an artist route", () => {
      const req = {
        user: { role: "client" },
      };
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authController.restrictTo("artist");
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.statusCode).toBe(403);
      expect(err.message).toMatch(/permission/i);
    });

    it("should allow an artist to access an artist route", () => {
      const req = {
        user: { role: "artist" },
      };
      const res = mockResponse();
      const next = jest.fn();

      const middleware = authController.restrictTo("artist");
      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe("forgotPassword", () => {
    it("should call next AppError when there is no user matching provided email", async () => {
      const req = { body: { email: "nonexistent@example.com" } };
      const res = mockResponse();
      const next = jest.fn();

      jest.spyOn(Users, "findOne").mockResolvedValue(null);

      await authController.forgotPassword(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/no user with that email/i);
      expect(err.statusCode).toBe(404);

      Users.findOne.mockRestore();
    });

    xit("should mock successful createPasswordResetToken and email send", async () => {
      // Cant implement yet, email logic not set up
    });

    xit("should mock email sending failure", async () => {
      // Cant implement yet, email logic not set up
    });
  });

  describe("requestPasswordChange", () => {
    it("should call next AppError when no user is logged in", async () => {
      const req = {};
      const res = mockResponse();
      const next = jest.fn();

      await authController.requestPasswordChange(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/please log in/i);
      expect(err.statusCode).toBe(401);
    });

    it("should call next AppError when user cannot be found", async () => {
      const req = { user: { id: 1 } };
      const res = mockResponse();
      const next = jest.fn();

      jest.spyOn(Users, "findByPk").mockResolvedValue(null);

      await authController.requestPasswordChange(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/couldn't find/i);
      expect(err.statusCode).toBe(404);

      Users.findByPk.mockRestore();
    });

    xit("should call res.status(200).json(...) when successful", async () => {
      // Cant implement yet, email logic not set up
    });

    xit("should fail to send an email when passwordResetToken and passwordResetExpires are undefined", async () => {
      // Cant implement yet, email logic not set up
    });
  });

  describe("resetPassword", () => {
    it("should call next AppError when passwordResetToken is invalid or expired", async () => {
      const rawToken = "invalidtoken";
      const hashedToken = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

      const req = {
        query: { token: rawToken },
        body: {},
      };
      const res = {};
      const next = jest.fn();

      const findOneSpy = jest.spyOn(Users, "findOne").mockResolvedValue(null);

      await new Promise((resolve) => {
        authController.resetPassword(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith({
        where: {
          passwordResetToken: hashedToken,
          passwordResetExpires: { [Sequelize.Op.gt]: expect.any(Number) },
        },
      });

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/token is invalid or has expired/i);

      findOneSpy.mockRestore();
    });

    it("should error when req.body.password is missing", async () => {
      const mockUser = {
        passwordResetToken: "sometoken",
        passwordResetExpires: Date.now() + 10000,
        save: jest.fn(),
      };

      const req = {
        params: { token: "resettoken" },
        body: {},
      };
      const res = mockResponse();
      const next = jest.fn();

      const hashedToken = crypto
        .createHash("sha256")
        .update("resettoken")
        .digest("hex");

      jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

      await authController.resetPassword(req, res, next);

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(Error);
      Users.findOne.mockRestore();
    });

    xit("should successfully reset a users password", async () => {
      // Cant implement yet, email logic not set up
    });
  });

  describe("updatePassword", () => {
    it("should call next AppError when req.user is not set", async () => {
      const req = { user: null }; // or simply {}
      const res = mockResponse();
      const next = jest.fn();

      await authController.updatePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err = next.mock.calls[0][0];
      expect(err.message).toMatch(/user not found/i);
      expect(err.statusCode).toBe(401);
    });

    it("should call next AppError when user.correctPassword is false", async () => {
      const mockUser = {
        id: 1,
        correctPassword: jest.fn().mockResolvedValue(false),
      };

      const req = {
        user: { id: 1 },
        body: { passwordCurrent: "wrongpassword" },
      };
      const res = mockResponse();
      const next = jest.fn();

      jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);

      await new Promise((resolve) => {
        authController.updatePassword(req, res, (err) => {
          next(err);
          resolve();
        });
      });

      expect(Users.findByPk).toHaveBeenCalledWith(1);
      expect(mockUser.correctPassword).toHaveBeenCalledWith(
        "wrongpassword",
        undefined
      );
      expect(next).toHaveBeenCalledWith(expect.any(AppError));
      const err = next.mock.calls[0][0];
      expect(err.message).toMatch(/current password is wrong/i);
      expect(err.statusCode).toBe(401);

      Users.findByPk.mockRestore();
    });

    it("should send error when req.body.password is missing", async () => {
      const mockUser = {
        id: 1,
        correctPassword: jest.fn().mockResolvedValue(true),
        save: jest
          .fn()
          .mockRejectedValue(
            new Error("notNull Violation: passwordHash cannot be null")
          ),
      };

      const req = {
        user: { id: 1 },
        body: {
          passwordCurrent: "correct-password",
        },
      };
      const res = mockResponse();
      const next = jest.fn();

      jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);

      await new Promise((resolve) => {
        authController.updatePassword(req, res, (err) => {
          next(err);
          resolve();
        });
      });

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      const error = next.mock.calls[0][0];
      expect(error.message).toMatch(/cannot be null/i);

      Users.findByPk.mockRestore();
    });

    xit("should successfully update password", async () => {
      // Cant implement yet, email logic not set up
    });
  });
});
