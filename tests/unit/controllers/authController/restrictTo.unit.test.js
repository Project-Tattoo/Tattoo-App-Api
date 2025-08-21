const authController = require("./../../../../controllers/shared/authController");
const AppError = require("../../../../utils/appError");
const { mockResponse } = require("../../../utils/mockExpress");

describe("restrictTo", () => {
  let req, res, next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
  });

  it("should throw next AppError when req.user is not set", () => {
    req = {};

    const middleware = authController.restrictTo("artist");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/permission/i);
  });

  it("should throw next AppError when a client tries to access an artist route", () => {
    req = { user: { role: "user" } };

    const middleware = authController.restrictTo("artist");
    middleware(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(403);
    expect(err.message).toMatch(/permission/i);
  });

  it("should allow an artist to access an artist route", () => {
    req = { user: { role: "artist" } };

    const middleware = authController.restrictTo("artist");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });
});
