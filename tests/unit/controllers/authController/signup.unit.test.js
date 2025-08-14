const authController = require("./../../../../controllers/general/authController");
const Users = require("./../../../../models/shared/Users");
const db = require("./../../../../server");
const AppError = require("../../../../utils/appError");
const { mockRequest, mockResponse } = require("../../../utils/mockExpress");
const mockSequelizeUniqueConstraintError = require("./../../../utils/mockSequelizeUniqueConstraintError")
const mockSequelizeValidationError = require("./../../../utils/mockSequelizeValidationError")

require("dotenv").config({ path: "./.env.test" });

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  return res;
};

describe("signup", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    req = { body: {}, ip: "127.0.0.1", headers: {}, cookies: {} };
    res = createMockResponse();
    next = jest.fn();
  });

  it("should prevent signup with missing fields", async () => {
    req.body = { email: "test@example.com", password: "123456" };
    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/Please provide first/);
    expect(err.statusCode).toBe(400);
  });

  it("should prevent registration with passwords that don't match", async () => {
    req.body = {
      firstName: "firstName",
      lastName: "lastName",
      email: "test@example.com",
      password: "password123",
      passwordConfirm: "password1234",
      role: "user",
    };
    jest.spyOn(db, "transaction");

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toContain("Passwords do not match.");
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("should prevent registration of an admin role", async () => {
    req.body = {
      firstName: "firstName",
      lastName: "lastName",
      email: "admin@example.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "admin",
    };

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/Admin accounts cannot be registered/);
    expect(error.statusCode).toBe(403);
  });

  it("should prevent registration with an invalid role", async () => {
    req.body = {
      firstName: "firstName",
      lastName: "lastName",
      email: "invalidrole@example.com",
      password: "password123",
      passwordConfirm: "password123",
      role: "superuser",
    };
    jest.spyOn(Users, "create");
    jest.spyOn(db, "transaction");

    await authController.signup(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/invalid user role/i);
    expect(error.statusCode).toBe(400);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(Users.create).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("should handle SequelizeUniqueConstraintError", async () => {
    req = mockRequest({
      body: {
        firstName: "firstName",
        lastName: "lastName",
        email: "duplicate@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "user",
        displayName: "duplicateUser",
      },
    });
    const res = mockResponse();
    const next = jest.fn();

    await Users.create({
      firstName: "firstName",
      lastName: "lastName",
      email: "duplicate@example.com",
      passwordHash: "hashedpsddewor",
      role: "user",
      isActive: true,
      verifiedEmail: false,
      displayName: "duplicateUser2",
    });

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });
    await new Promise((resolve) => setImmediate(resolve));

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toMatch(/duplicate@example\.com/);
    expect(error.statusCode).toBe(400);
  });

  it("should handle SequelizeValidationError", async () => {
    req = mockRequest({
      body: {
        firstName: "firstName",
        lastName: "lastName",
        email: "invalid-email",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "user",
        displayName: "testing2",
      },
    });

    const error = mockSequelizeValidationError(["Email format is invalid."]);
    jest.spyOn(Users, "create").mockRejectedValue(error);

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const receivedError = next.mock.calls[0][0];
    expect(receivedError).toBeInstanceOf(AppError);
    expect(receivedError.message).toMatch(/Invalid input data:/);
    expect(receivedError.statusCode).toBe(400);
  });

  it("should handle a general error during transaction", async () => {
    req = mockRequest({
      body: {
        firstName: "firstName",
        lastName: "lastName",
        email: "test@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "user",
        displayName: "testUser",
      },
    });

    const generalError = new Error("Something went wrong");
    jest.spyOn(Users, "create").mockRejectedValue(generalError);

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const receivedError = next.mock.calls[0][0];
    expect(receivedError).toBe(generalError);
  });
});
