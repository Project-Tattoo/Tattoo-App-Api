const authController = require("./../../../../controllers/general/authController");
const Users = require("./../../../../models/shared/Users");
const db = require("./../../../../server");
const AppError = require("../../../../utils/appError");
const { mockRequest, mockResponse } = require("../../../utils/mockExpress");
const mockSequelizeUniqueConstraintError = require("./../../../utils/mockSequelizeUniqueConstraintError");
const mockSequelizeValidationError = require("./../../../utils/mockSequelizeValidationError");
const Welcome = require("./../../../../email/classes/welcome");
const createSendToken = require("./../../../../utils/createSendToken");
const normalizeIpAddress = require("./../../../../utils/normalizeIpAddress");
const EmailPreferences = require("./../../../../models/shared/EmailPreferences");
const TOSAgreement = require("./../../../../models/shared/TOSAgreement");

jest.mock("./../../../../utils/normalizeIpAddress");
jest.mock("./../../../../email/classes/welcome");
jest.mock("./../../../../utils/createSendToken");
jest.mock("./../../../../models/shared/Users");
jest.mock("./../../../../models/shared/EmailPreferences");
jest.mock("./../../../../models/shared/TOSAgreement");

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

    createSendToken.mockImplementation(() => {
      return res.status(201).json({
        status: "success",
        token: "mock-token",
        data: { user: { id: "mockUserId", email: "mock@example.com" } },
      });
    });

    jest.spyOn(db, "transaction").mockResolvedValue({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    });

    Users.create.mockResolvedValue({
      id: "mockUserId",
      email: "mock@example.com",
      firstName: "Mock",
    });
    EmailPreferences.create.mockResolvedValue({});
    TOSAgreement.create.mockResolvedValue({});
  });

  beforeAll(() => {
    normalizeIpAddress.mockReturnValue("127.0.0.1");
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
    Users.create.mockClear();
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

    const error = mockSequelizeUniqueConstraintError(["email"]);
    Users.create.mockRejectedValue(error);

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const receivedError = next.mock.calls[0][0];
    expect(receivedError).toBeInstanceOf(AppError);
    expect(receivedError.message).toMatch(/duplicate@example\.com/);
    expect(receivedError.statusCode).toBe(400);
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
    const res = mockResponse();
    const next = jest.fn();

    const error = mockSequelizeValidationError(["Email format is invalid."]);
    Users.create.mockRejectedValue(error);

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
    const res = mockResponse();
    const next = jest.fn();

    const generalError = new Error("Something went wrong");
    Users.create.mockRejectedValue(generalError);

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const receivedError = next.mock.calls[0][0];
    expect(receivedError).toBe(generalError);
  });

  it("should call next with error when displayName is missing", async () => {
    const req = {
      body: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "user",
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await authController.signup(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/display name/i);
    expect(err.statusCode).toBe(400);
  });

  it("should send welcome email when not in test environment", async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const sendWelcomeMock = jest.fn().mockResolvedValue();
    Welcome.mockImplementation(() => ({
      sendWelcome: sendWelcomeMock,
    }));

    Users.create.mockResolvedValue({
      id: "mockUserId",
      email: "jane@example.com",
      firstName: "Jane",
      displayName: "JaneD",
    });

    const req = {
      body: {
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "user",
        displayName: "JaneD",
      },
    };
    const res = mockResponse();
    const next = jest.fn();

    await authController.signup(req, res, next);

    expect(Welcome).toHaveBeenCalledWith({
      recipient: "jane@example.com",
      firstName: "Jane",
    });

    expect(sendWelcomeMock).toHaveBeenCalled();

    process.env.NODE_ENV = originalNodeEnv;
  });
});
