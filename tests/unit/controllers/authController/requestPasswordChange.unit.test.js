const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

describe("requestPasswordChange", () => {
  let req, res, next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next AppError when no user is logged in", async () => {
    req = {};

    await authController.requestPasswordChange(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/please log in/i);
    expect(err.statusCode).toBe(401);
  });

  it("should call next AppError when user cannot be found", async () => {
    req = { user: { id: 1 } };

    jest.spyOn(Users, "findByPk").mockResolvedValue(null);

    await authController.requestPasswordChange(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/couldn't find/i);
    expect(err.statusCode).toBe(404);
  });
});
