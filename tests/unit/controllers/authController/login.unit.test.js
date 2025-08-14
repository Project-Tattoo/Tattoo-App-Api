const authController = require("./../../../../controllers/general/authController");
const Users = require("./../../../../models/shared/Users");
const AppError = require("../../../../utils/appError");
const { mockRequest, mockResponse } = require("../../../utils/mockExpress");

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
});
