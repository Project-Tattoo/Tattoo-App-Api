const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockRequest, mockResponse } = require("../../../utils/mockExpress");

describe("protect", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  it("should call AppError when a user is not logged in", async () => {
    req = mockRequest({ headers: {}, cookies: {} });

    const protectMiddleware = authController.protect(Users);
    await protectMiddleware(req, res, next);

    const err = next.mock.calls[0][0];
    expect(next).toHaveBeenCalled();
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/not logged in/i);
    expect(err.statusCode).toBe(401);
  });

  it("should throw an error when verifying token if invalid", async () => {
    req = mockRequest({
      headers: { authorization: "Bearer invalid.token" },
      cookies: {},
    });

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
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

  it("should call AppError if user no longer exists", async () => {
    req = mockRequest({
      headers: { authorization: "Bearer valid.token" },
      cookies: {},
    });

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      setTimeout(() => callback(null, { id: 999, iat: Date.now() / 1000 }), 0);
    });

    const mockUsers = { findByPk: jest.fn().mockResolvedValue(null) };
    const protectMiddleware = authController.protect(mockUsers);

    await new Promise((resolve) => {
      protectMiddleware(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(mockUsers.findByPk).toHaveBeenCalledWith(999);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/no longer exists/i);
    expect(err.statusCode).toBe(401);

    jwt.verify.mockRestore();
  });

  it("should call AppError if password was changed after token issuance", async () => {
    req = mockRequest({
      headers: { authorization: "Bearer valid.token" },
      cookies: {},
    });

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      setTimeout(
        () => callback(null, { id: 123, iat: Math.floor(Date.now() / 1000) - 100 }),
        0
      );
    });

    const fakeUser = { changedPasswordAfter: jest.fn().mockResolvedValue(true) };
    const mockUsers = { findByPk: jest.fn().mockResolvedValue(fakeUser) };

    const protectMiddleware = authController.protect(mockUsers);
    await new Promise((resolve) => {
      protectMiddleware(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(fakeUser.changedPasswordAfter).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/password has been changed/i);
    expect(err.statusCode).toBe(401);

    jwt.verify.mockRestore();
  });

  it("should allow access for valid token and user", async () => {
    req = mockRequest({
      headers: { authorization: "Bearer valid.token" },
      cookies: {},
    });

    const fakeUser = { id: 123, email: "user@example.com", changedPasswordAfter: jest.fn().mockResolvedValue(false) };
    const mockUsers = { findByPk: jest.fn().mockResolvedValue(fakeUser) };

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      setTimeout(() => callback(null, { id: fakeUser.id, iat: Math.floor(Date.now() / 1000) - 100 }), 0);
    });

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

  it("should extract token from cookies if header missing", async () => {
    req = mockRequest({
      headers: {},
      cookies: { jwt: "cookie.jwt.token" },
    });

    const fakeUser = { id: 123, changedPasswordAfter: jest.fn().mockResolvedValue(false) };
    const mockUsers = { findByPk: jest.fn().mockResolvedValue(fakeUser) };

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      setTimeout(() => callback(null, { id: fakeUser.id, iat: Math.floor(Date.now() / 1000) }), 0);
    });

    const protectMiddleware = authController.protect(mockUsers);
    await new Promise((resolve) => {
      protectMiddleware(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(jwt.verify).toHaveBeenCalledWith(
      "cookie.jwt.token",
      process.env.NODE_ENV === "production"
        ? process.env.PROD_JWT_SECRET
        : process.env.DEV_JWT_SECRET,
      expect.any(Function)
    );
    expect(mockUsers.findByPk).toHaveBeenCalledWith(fakeUser.id);
    expect(req.user).toBe(fakeUser);
    expect(res.locals.user).toBe(fakeUser);
    expect(next).toHaveBeenCalledWith();

    jwt.verify.mockRestore();
  });
});
