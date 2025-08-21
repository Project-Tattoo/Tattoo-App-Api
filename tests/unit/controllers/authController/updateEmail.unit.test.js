const authController = require("./../../../../controllers/shared/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const crypto = require("crypto");
const { Sequelize } = require("sequelize");
const { mockResponse } = require("../../../utils/mockExpress");

jest.mock("../../../../models/shared/Users");

describe("updateEmail", () => {
  let req, res, next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next with AppError when emailChangeToken is invalid or expired", async () => {
    const rawToken = "invalidToken";
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const req = { query: { token: rawToken }, body: {} };

    const findOneSpy = jest.spyOn(Users, "findOne").mockResolvedValue(null);

    await new Promise((resolve) => {
      authController.updateEmail(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(findOneSpy).toHaveBeenCalledTimes(1);
    expect(findOneSpy).toHaveBeenCalledWith({
      where: {
        emailChangeToken: hashedToken,
        emailChangeExpires: { [Sequelize.Op.gt]: expect.any(Number) },
      },
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/token is invalid or has expired/i);
    expect(error.statusCode).toBe(400);
  });

  it("should call next with AppError on a general error", async () => {
    const rawToken = "validtoken123";
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const mockUser = {
      emailChangeToken: hashedToken,
      emailChangeExpires: Date.now() + 10000,
      save: jest.fn().mockRejectedValue(new Error("Database error")),
    };

    const req = {
      query: { token: rawToken },
      body: { newEmail: "newEmail@email.com" },
    };
    jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      authController.updateEmail(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(500);
    expect(errorArg.message).toBe(
      "There was an error while updating your email"
    );
  });
});
