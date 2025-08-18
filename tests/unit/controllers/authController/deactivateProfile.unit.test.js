const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

jest.mock("../../../../models/shared/Users");

describe("deactivateProfile", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
    mockUser = {
      id: 1,
      isActive: true,
      save: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next with AppError when no user is logged in", async () => {
    req = {};

    await authController.deactivateProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/user not found/i);
    expect(err.statusCode).toBe(401);
  });

  it("should call next with AppError when user cannot be found", async () => {
    req = { user: { id: 1 } };
    jest.spyOn(Users, "findByPk").mockResolvedValue(null);

    await authController.deactivateProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/couldn't find/i);
    expect(err.statusCode).toBe(404);
  });

  it("should handle errors during deactivation", async () => {
    req = { user: { id: 1 } };
    jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);
    mockUser.save.mockRejectedValue(new Error("Database error"));

    await new Promise((resolve) => {
      authController.deactivateProfile(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/error while deactivating/i);
    expect(error.statusCode).toBe(500);
  });
});
