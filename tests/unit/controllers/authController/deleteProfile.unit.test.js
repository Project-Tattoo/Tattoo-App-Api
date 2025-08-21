const authController = require("./../../../../controllers/shared/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");

describe("deleteProfile", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    req = { user: { id: 1 } };
    res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();

    mockUser = {
      id: 1,
      destroy: jest.fn().mockResolvedValue(true),
    };
  });

  it("should return 401 if no logged-in user in request", async () => {
    req.user = null;
    await authController.deleteProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe("User not found in request. Please log in.");
  });

  it("should return 404 if user not found in DB", async () => {
    Users.findByPk = jest.fn().mockResolvedValue(null);

    await authController.deleteProfile(req, res, next);

    expect(Users.findByPk).toHaveBeenCalledWith(req.user.id);
    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe("Couldn't find the logged in user.");
  });

  it("should handle errors during deletion", async () => {
    Users.findByPk = jest.fn().mockResolvedValue({
      ...mockUser,
      destroy: jest.fn().mockRejectedValue(new Error("DB error")),
    });

    await new Promise((resolve) => {
      authController.deleteProfile(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.statusCode).toBe(500);
    expect(err.message).toBe(
      "There was an error while deleting your account. Please try again later."
    );
  });
});
