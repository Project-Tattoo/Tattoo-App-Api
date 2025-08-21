const authController = require("./../../../../controllers/shared/authController");
const Users = require("./../../../../models/shared/Users");
const AppError = require("../../../../utils/appError");
const { mockRequest, mockResponse } = require("../../../utils/mockExpress");
const createSendToken = require("./../../../../utils/createSendToken");
jest.mock("./../../../../utils/createSendToken");

describe("login", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  it("should prevent login if email or password is missing", async () => {
    const cases = [
      { email: "", password: "testpass" },
      { email: "test@example.com", password: "" },
      { email: "", password: "" },
      { email: null, password: "testpass" },
      { email: "test@example.com", password: null },
    ];

    for (const body of cases) {
      req = mockRequest({ body });

      await new Promise((resolve) => {
        authController.login(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      const err = next.mock.calls[next.mock.calls.length - 1][0];
      expect(next).toHaveBeenCalled();
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/email and password/i);
      expect(err.statusCode).toBe(400);
    }
  });

  it("should throw an error when user is not found", async () => {
    req = mockRequest({
      body: {
        email: "nonexistent@example.com",
        password: "somePassword123",
      },
    });

    jest.spyOn(Users, "findOne").mockResolvedValue(null);

    await new Promise((resolve) => {
      authController.login(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const err = next.mock.calls[0][0];
    expect(next).toHaveBeenCalled();
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/incorrect email or password/i);
    expect(err.statusCode).toBe(401);
  });

  it("should prevent login with an incorrect password", async () => {
    req = mockRequest({
      body: {
        email: "valid@example.com",
        password: "wrongPassword123",
      },
    });

    const mockUser = {
      id: 1,
      firstName: "firstName",
      lastName: "lastName",
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

    const err = next.mock.calls[0][0];
    expect(next).toHaveBeenCalled();
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/incorrect email or password/i);
    expect(err.statusCode).toBe(401);
  });

  it("should prevent login for inactive accounts", async () => {
    const mockUser = {
      id: 1,
      email: "inactive@example.com",
      isActive: false,
      passwordHash: "hashedpassword",
      correctPassword: jest.fn().mockResolvedValue(true),
    };

    req = mockRequest({
      body: {
        email: "inactive@example.com",
        password: "correctpassword",
      },
    });

    Users.findOne = jest.fn().mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      authController.login(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    const err = next.mock.calls[0][0]
    expect(next).toHaveBeenCalled()
    expect(err).toBeInstanceOf(AppError)
    expect(err.message).toMatch(/account is deactivated/i)
    expect(err.statusCode).toBe(403)
  });
});
