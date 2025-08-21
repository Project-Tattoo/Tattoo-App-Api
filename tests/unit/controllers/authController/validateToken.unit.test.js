const jwt = require("jsonwebtoken");
const authController = require("./../../../../controllers/shared/authController");
const { mockRequest, mockResponse } = require("../../../utils/mockExpress");

describe("validateToken", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    res = mockResponse();
    next = jest.fn();
  });

  it("should reject when no token is provided", async () => {
    req = mockRequest({
      headers: {},
      cookies: {},
    });

    await authController.validateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      valid: false,
      message: "No token provided.",
    });
  });

  it("should validate token provided in headers", async () => {
    const fakeToken = "valid.header.payload";
    req = mockRequest({
      headers: { authorization: `Bearer ${fakeToken}` },
      cookies: {},
    });

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      callback(null, { id: 1 });
    });

    await authController.validateToken(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.json).toHaveBeenCalledWith({
      valid: true,
      message: "Token is valid.",
    });

    jwt.verify.mockRestore();
  });

  it("should validate token provided in cookies", async () => {
    const fakeToken = "valid.header.payload";
    req = mockRequest({
      headers: {},
      cookies: { jwt: fakeToken },
    });

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      callback(null, { id: 1 });
    });

    await authController.validateToken(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.json).toHaveBeenCalledWith({
      valid: true,
      message: "Token is valid.",
    });

    jwt.verify.mockRestore();
  });

  it("should reject expired or malformed tokens", async () => {
    const fakeToken = "invalid.token.payload";
    req = mockRequest({
      headers: { authorization: `Bearer ${fakeToken}` },
      cookies: {},
    });

    jest.spyOn(jwt, "verify").mockImplementation((token, secret, callback) => {
      callback(new Error("Token is malformed or expired"));
    });

    await authController.validateToken(req, res, next);
    await new Promise((resolve) => setImmediate(resolve));

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      valid: false,
      message: "Invalid or expired token.",
    });

    jwt.verify.mockRestore();
  });
});
