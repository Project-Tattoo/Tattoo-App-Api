const errorHandler = require("./../../../controllers/general/errorController");
const AppError = require("./../../../utils/appError");
const { mockRequest, mockResponse } = require("./../../utils/mockExpress");

describe("errorController", () => {
  const originalEnv = process.env;
  let req, res, next;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    req = mockRequest();
    res = mockResponse();
    next = jest.fn();
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("falls through to production branch if NODE_ENV is unknown", () => {
    process.env.NODE_ENV = "staging"; 

    const err = new AppError("Something failed", 500);
    
    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went very wrong!",
    });
  });

  it("handleCastErrorDB returns formatted AppError", () => {
    process.env.NODE_ENV = "production";

    const err = new Error("CastError");
    err.name = "CastError";
    err.path = "id";
    err.value = "invalid-id";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: "Invalid id: invalid-id.",
      })
    );
  });

  it("handleDuplicateFieldsDB returns formatted AppError", () => {
    process.env.NODE_ENV = "production";

    const err = new Error("Duplicate field");
    err.name = "SequelizeUniqueConstraintError";
    err.errors = [
      {
        message: '"email" must be unique',
      },
    ];

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: expect.stringContaining("Duplicate field value"),
      })
    );
  });

  it("handleValidationErrorDB returns formatted AppError", () => {
    process.env.NODE_ENV = "production";

    const err = new Error("Validation error");
    err.name = "SequelizeValidationError";
    err.errors = [
      { message: "Name is required" },
      { message: "Email must be valid" },
    ];

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: "Invalid input data. Name is required. Email must be valid",
      })
    );
  });

  it("handleJWTError returns AppError with 401", () => {
    process.env.NODE_ENV = "production";

    const err = new Error("Invalid token");
    err.name = "JsonWebTokenError";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: "Invalid token. Please log in again!",
      })
    );
  });

  it("handleJWTExpiredError returns AppError with 401", () => {
    process.env.NODE_ENV = "production";

    const err = new Error("JWT expired");
    err.name = "TokenExpiredError";

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: "Your token has expired! Please log in again.",
      })
    );
  });

  it("sends detailed error in development/test environment", () => {
    process.env.NODE_ENV = "test";

    const err = new AppError("Something failed", 400);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "fail",
        message: "Something failed",
        stack: expect.any(String),
        error: expect.any(Object),
      })
    );
  });

  it("sends clean error in production with isOperational=true", () => {
    process.env.NODE_ENV = "production";

    const err = new AppError("Expected error", 403);

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      status: "fail",
      message: "Expected error",
    });
  });

  it("sends generic error in production when non-operational", () => {
    process.env.NODE_ENV = "production";

    const err = new Error("Unexpected failure");
    err.statusCode = 500;
    err.status = "error";
    err.isOperational = false;

    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    errorHandler(err, req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith("ERROR:", err);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: "error",
      message: "Something went very wrong!",
    });

    consoleSpy.mockRestore();
  });
});
