const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");
const crypto = require("crypto");

jest.mock("../../../../models/shared/Users");

describe("reactivateProfile", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
    mockUser = {
      id: 1,
      isActive: false,
      reactivateAccountToken: crypto
        .createHash("sha256")
        .update("validToken")
        .digest("hex"),
      reactivateAccountExpires: Date.now() + 3600000, // 1 hour from now
      save: jest.fn().mockImplementation(function () {
        this.isActive = true;
        this.reactivateAccountToken = null;
        this.reactivateAccountExpires = null;
        return Promise.resolve(this);
      }),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next with AppError when token is invalid or expired", async () => {
    req = {
      query: { token: "invalidToken" },
    };
    jest.spyOn(Users, "findOne").mockResolvedValue(null);

    await authController.reactivateProfile(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/token is invalid/i);
    expect(err.statusCode).toBe(400);
  });

  it("should handle errors during reactivation", async () => {
    req = {
      user: { id: 1 },
      body: { token: "validToken" },
    };
    jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);
    mockUser.save.mockRejectedValue(new Error("Database error"));

    await new Promise((resolve) => {
      authController.reactivateProfile(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/error while reactivating/i);
    expect(err.statusCode).toBe(500);
  });
});
