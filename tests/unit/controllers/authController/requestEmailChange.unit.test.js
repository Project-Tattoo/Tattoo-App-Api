const authController = require("./../../../../controllers/shared/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

jest.mock("../../../../models/shared/Users");

describe("requestEmailChange", () => {
  let req, res, next, mockUser;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();

    mockUser = {
      id: 1,
      email: "test@example.com",
      createEmailChangeToken: jest.fn().mockReturnValue("mockToken"),
      save: jest.fn().mockResolvedValue(true),
      emailChangeToken: "mockToken",
      emailChangeExpires: Date.now() + 3600000,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next with AppError when no user is logged in", async () => {
    req = {};

    await authController.requestEmailChange(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/please log in/i);
    expect(err.statusCode).toBe(401);
  });

  it("should call next with AppError when user cannot be found", async () => {
    req = { user: { id: 1 } };
    jest.spyOn(Users, "findByPk").mockResolvedValue(null);

    await authController.requestEmailChange(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/couldn't find/i);
    expect(err.statusCode).toBe(404);
  });

  it("should send a 200 success response when the request is valid", async () => {
    req = { user: { id: 1 } };
    jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      res.json.mockImplementationOnce(() => {
        resolve();
      });
      authController.requestEmailChange(req, res, next);
    });

    expect(Users.findByPk).toHaveBeenCalledWith(1);
    expect(mockUser.createEmailChangeToken).toHaveBeenCalled();
    expect(mockUser.save).toHaveBeenCalledTimes(1);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Email update request token sent to your email!",
    });

    expect(next).not.toHaveBeenCalled();
  });

  it("should handle errors during token generation/save", async () => {
    req = { user: { id: 1 } };
    jest.spyOn(Users, "findByPk").mockResolvedValue(mockUser);

    let saveCallCount = 0;
    mockUser.save.mockImplementation(async () => {
      saveCallCount++;
      if (saveCallCount === 1) {
        throw new Error("DB save failed");
      }
      return true;
    });

    await new Promise((resolve) => {
      authController.requestEmailChange(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const errorArg = next.mock.calls[0][0];
    expect(errorArg.statusCode).toBe(500);
    expect(errorArg.message).toBe(
      "There was an error while requesting an email update. Please try again later."
    );

    expect(mockUser.save).toHaveBeenCalledTimes(2);
  });
});
