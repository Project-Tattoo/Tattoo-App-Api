const authController = require("./../../../../controllers/general/authController");
const AppError = require("../../../../utils/appError");
const Users = require("../../../../models/shared/Users");
const { mockResponse } = require("../../../utils/mockExpress");

describe("forgotPassword", () => {
  let req, res, next;

  beforeEach(() => {
    res = mockResponse();
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should call next AppError when there is no user matching provided email", async () => {
    req = { body: { email: "nonexistent@example.com" } };

    jest.spyOn(Users, "findOne").mockResolvedValue(null);

    await authController.forgotPassword(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/no user with that email/i);
    expect(err.statusCode).toBe(404);
  });
});
