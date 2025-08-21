const authController = require("./../../../../controllers/shared/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

jest.mock("../../../../models/shared/Users");

describe("forgotPassword", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    req = { body: { email: "test@example.com" } };
    res = mockResponse();
    next = jest.fn();

    mockUser = {
      id: 1,
      email: "test@example.com",
      createPasswordResetToken: jest.fn().mockReturnValue("mockToken"),
      save: jest.fn().mockResolvedValue(true),
      passwordResetToken: "mockToken",
      passwordResetExpires: Date.now() + 3600000,
    };
  });

  it("should error when no user exists", async () => {
    Users.findOne = jest.fn().mockResolvedValue(null);

    await authController.forgotPassword(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].statusCode).toBe(404);
  });

  it("should send a 200 success response when user and email are valid", async () => {
    Users.findOne = jest.fn().mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      res.json.mockImplementationOnce(() => {
        resolve();
      });

      authController.forgotPassword(req, res, next);
    });

    expect(mockUser.createPasswordResetToken).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Password reset token sent to email!",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should handle errors during token generation/save", async () => {
    Users.findOne = jest.fn().mockResolvedValue(mockUser);

    let saveCallCount = 0;
    mockUser.save.mockImplementation(async () => {
      saveCallCount++;

      if (saveCallCount === 1) {
        throw new Error("DB save failed");
      }

      return true;
    });

    await new Promise((resolve) => {
      authController.forgotPassword(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(500);
    expect(errorArg.message).toBe(
      "There was an error while requesting a password change. Please try again later."
    );

    expect(mockUser.save).toHaveBeenCalledTimes(2);
  });
});
