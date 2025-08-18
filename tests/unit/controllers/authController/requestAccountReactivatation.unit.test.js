const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

jest.mock("../../../../models/shared/Users");

describe("requestAccountReactivation", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
    mockUser = {
      id: 1,
      email: "test@example.com",
      firstName: "Test",
      isActive: false,
      createReactivateAccountToken: jest.fn().mockReturnValue("mockToken"),
      save: jest.fn().mockResolvedValue(true),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next with AppError when email is missing", async () => {
    req = { body: {} };

    await authController.requestAccountReactivation(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/provide your email/i);
    expect(err.statusCode).toBe(400);
  });

  it("should call next with AppError when user is not found", async () => {
    req = { body: { email: "nonexistent@example.com" } };
    jest.spyOn(Users, "findOne").mockResolvedValue(null);

    await authController.requestAccountReactivation(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/no account found/i);
    expect(err.statusCode).toBe(404);
  });

  it("should call next with AppError when account is already active", async () => {
    mockUser.isActive = true;
    req = { body: { email: "test@example.com" } };
    jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

    await authController.requestAccountReactivation(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/already active/i);
    expect(err.statusCode).toBe(400);
  });

  it("should handle errors during reactivation request", async () => {
    req = { body: { email: "test@example.com" } };
    jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);
    mockUser.save.mockRejectedValue(new Error("Database error"));

    await new Promise((resolve) => {
      authController.requestAccountReactivation(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/error while requesting/i);
    expect(err.statusCode).toBe(500);
  });

  it("should send success response for valid request", async () => {
    req = { body: { email: "test@example.com" } };
    jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      res.json.mockImplementationOnce(() => {
        resolve();
      });
      authController.requestAccountReactivation(req, res, next);
    });

    expect(mockUser.createReactivateAccountToken).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalledWith({ validate: false });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Reactivation link sent to your email.",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
