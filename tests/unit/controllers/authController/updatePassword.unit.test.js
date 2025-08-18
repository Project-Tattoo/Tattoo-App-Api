const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

describe("updatePassword", () => {
  let res, next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next AppError when req.user is not set", async () => {
    const req = { user: null };

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
      body: {
        passwordCurrent: "wrongpassword",
        password: "new-password",
      },
    };

    jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      authController.updatePassword(req, res, (err) => {
        next(err);
        resolve();
      });
    });

    expect(Users.findByPk).toHaveBeenCalledWith(1);
    expect(mockUser.correctPassword).toHaveBeenCalledWith("wrongpassword");
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

  it("should handle errors during password update", async () => {
    const mockUser = {
      id: 1,
      correctPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn().mockRejectedValue(new Error("Database error")),
    };

    const req = {
      user: { id: 1 },
      body: {
        passwordCurrent: "oldPass123",
        password: "newPass123",
        passwordConfirm: "newPass123",
      },
    };

    jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      authController.updatePassword(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(
      new AppError("There was an error while updating your password", 500)
    );

    Users.findByPk.mockRestore();
  });
});
