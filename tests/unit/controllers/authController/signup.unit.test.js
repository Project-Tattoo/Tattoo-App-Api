const authController = require("./../../../../controllers/shared/authController");
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

jest.spyOn(db, "transaction").mockResolvedValue({
  commit: jest.fn().mockResolvedValue(),
  rollback: jest.fn().mockResolvedValue(),
});

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

    createSendToken.mockImplementation((user, statusCode, req, res) => {

      res.cookie = jest.fn().mockReturnThis();


      return res.status(statusCode).json({
        status: "success",
        token: "mock-token",
        data: { user: { ...user.toJSON(), passwordHash: undefined } },
      });
    });

    jest.spyOn(db, "transaction").mockResolvedValue({
      commit: jest.fn().mockResolvedValue(),
      rollback: jest.fn().mockResolvedValue(),
    });

    Users.create.mockResolvedValue({
      id: "mockUserId",
      email: "jane@example.com",
      firstName: "Jane",
      lastName: "Doe",
      displayName: "JaneD",
      passwordHash: "Password123!",
      isActive: true,
      verifiedEmail: false,
    });
    EmailPreferences.create.mockResolvedValue({});
    TOSAgreement.create.mockResolvedValue({});
  });

  beforeAll(() => {
    normalizeIpAddress.mockReturnValue("127.0.0.1");
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

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/display name/i);
    expect(err.statusCode).toBe(400);
  });
});
