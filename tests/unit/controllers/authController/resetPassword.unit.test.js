const crypto = require("crypto");
const { Sequelize } = require("sequelize");
const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

describe("resetPassword", () => {
  let res, next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next AppError when passwordResetToken is invalid or expired", async () => {
    const rawToken = "invalidtoken";
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const req = { query: { token: rawToken }, body: {} };

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
  });

  it("should error when req.body.password is missing", async () => {
    const mockUser = {
      passwordResetToken: "sometoken",
      passwordResetExpires: Date.now() + 10000,
      save: jest.fn(),
    };

    const req = { params: { token: "resettoken" }, body: {} };

    const hashedToken = crypto
      .createHash("sha256")
      .update("resettoken")
      .digest("hex");

    jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

    await authController.resetPassword(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
  });
});
