const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const authController = require("../../../controllers/general/authController");
const AppError = require("../../../utils/appError");
const Users = require("../../../models/shared/Users");
const ClientProfiles = require("../../../models/clients/ClientProfiles");
const ArtistProfiles = require("../../../models/artists/ArtistProfiles");
const EmailPreference = require("../../../models/shared/EmailPreferences");
const TOSAgreement = require("../../../models/shared/TOSAgreement");
const db = require("../../../server");
const { Sequelize } = require("sequelize");
const mockSequelizeUniqueConstraintError = require("../../utils/mockSequelizeUniqueConstraintError");
const mockSequelizeValidationError = require("../../utils/mockSequelizeValidationError");
const { mockRequest, mockResponse } = require("./../../utils/mockExpress");

require("dotenv").config({ path: "./.env.test" });

const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn().mockReturnThis();
  res.cookie = jest.fn().mockReturnThis();
  return res;
};

const setupMockTransactionAndUser = () => {
  jest.spyOn(db, "transaction").mockImplementation(() => {
    return {
      commit: jest.fn().mockResolvedValue(true),
      rollback: jest.fn().mockResolvedValue(true),
    };
  });

  jest.spyOn(Users, "create").mockImplementation(async (data) => {
    const mockUser = {
      id: Math.floor(Math.random() * 1000) + 1,
      ...data,
      passwordHash: data.passwordHash || "mocked_hashed_password",
      toJSON: () => {
        const { passwordHash, ...rest } = mockUser;
        return rest;
      },
      save: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
    };
    return mockUser;
  });

  jest.spyOn(EmailPreference, "create").mockResolvedValue({});
  jest.spyOn(TOSAgreement, "create").mockResolvedValue({});
  jest.spyOn(ArtistProfiles, "create").mockResolvedValue({});
  jest.spyOn(ClientProfiles, "create").mockResolvedValue({});
};

describe("Auth API Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    req = {
      body: {},
      ip: "127.0.0.1",
      headers: {},
      cookies: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // --- Signup Tests ---
  it("should prevent signup with missing fields", async () => {
    const req = {
      body: {
        email: "test@example.com",
        password: "123456",
      },
      ip: "127.0.0.1",
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));

    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/Please provide email/);
    expect(err.statusCode).toBe(400);
  });

  it("should prevent registration with passwords that don't match", async () => {
    jest.spyOn(db, "transaction");

    const req = {
      body: {
        email: "test@example.com",
        password: "password123",
        passwordConfirm: "password1234",
        role: "client",
      },
      ip: "127.0.0.1",
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toContain("Passwords do not match.");
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("should prevent registration of an admin role", async () => {
    const req = {
      body: {
        email: "admin@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "admin",
      },
      ip: "127.0.0.1",
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/Admin accounts cannot be registered/);
    expect(error.statusCode).toBe(403);
  });

  it("should prevent registration with an invalid role", async () => {
    jest.spyOn(Users, "create");
    jest.spyOn(db, "transaction");
    const req = {
      body: {
        email: "invalidrole@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "superuser",
      },
      ip: "127.0.0.1",
    };
    const res = createMockResponse();
    const next = jest.fn();

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));

    const error = next.mock.calls[0][0];
    expect(error.message).toMatch(/invalid user role/i);
    expect(error.statusCode).toBe(400);

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(Users.create).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("should prevent registration of an artist with missing required profile fields", async () => {
    const req = {
      body: {
        email: "artist@example.com",
        password: "password123",
        passwordConfirm: "password123",
        role: "artist",
      },
      ip: "127.0.0.1",
    };

    const res = createMockResponse();
    const next = jest.fn();

    jest.spyOn(Users, "create");
    jest.spyOn(db, "transaction");

    await authController.signup(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    expect(next.mock.calls[0][0].message).toMatch(
      /display name, city, state, and zipcode/
    );

    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();

    expect(Users.create).not.toHaveBeenCalled();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("should handle a SequelizeUniqueConstraintError", async () => {
    const req = mockRequest({
      body: {
        email: "duplicate@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "client",
      },
    });
    const res = mockResponse();
    const next = jest.fn();

    await Users.create({
      email: "duplicate@example.com",
      passwordHash: "hashedpsddewor",
      role: "client",
      isActive: true,
      verifiedEmail: false,
    });

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalled();

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toMatch(/duplicate@example\.com/);
    expect(error.statusCode).toBe(400);
  });

  it("should handle a SequelizeValidationError", async () => {
    const req = mockRequest({
      body: {
        email: "invalid-email",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "client",
      },
    });
    const res = mockResponse();
    const next = jest.fn();

    const error = mockSequelizeValidationError(["Email format is invalid."]);

    jest.spyOn(Users, "create").mockRejectedValue(error);

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });
    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalled();

    const receivedError = next.mock.calls[0][0];
    expect(receivedError).toBeInstanceOf(AppError);
    expect(receivedError.message).toMatch(/Invalid input data: /);
    expect(receivedError.statusCode).toBe(400);
  });

  it("should handle a general error during transaction", async () => {
    const req = mockRequest({
      body: {
        email: "test@example.com",
        password: "Password123!",
        passwordConfirm: "Password123!",
        role: "client",
      },
    });
    const res = mockResponse();
    const next = jest.fn();

    const generalError = new Error("Something went wrong");
    jest.spyOn(Users, "create").mockRejectedValue(generalError);

    await new Promise((resolve) => {
      authController.signup(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });

    await new Promise((resolve) => setImmediate(resolve));

    expect(next).toHaveBeenCalled();
    const receivedError = next.mock.calls[0][0];
    expect(receivedError).toBe(generalError);
  });

  // --- Login Tests ---
  it("should prevent login if email or password is missing", async () => {
    const res = mockResponse();
    const next = jest.fn();

    const cases = [
      { email: "", password: "testpass" },
      { email: "test@example.com", password: "" },
      { email: "", password: "" },
      { email: null, password: "testpass" },
      { email: "test@example.com", password: null },
    ];

    for (const body of cases) {
      const req = mockRequest({ body });

      await new Promise((resolve) => {
        authController.login(req, res, (...args) => {
          next(...args);
          resolve();
        });
      });

      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[next.mock.calls.length - 1][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/email and password/i);
      expect(err.statusCode).toBe(400);
    }
  });

  it("should mock a user not being found with provided credentials", async () => {
    const req = mockRequest({
      body: {
        email: "nonexistent@example.com",
        password: "somePassword123",
      },
    });
    const res = mockResponse();
    const next = jest.fn();

    jest.spyOn(Users, "findOne").mockResolvedValue(null);

    await new Promise((resolve) => {
      authController.login(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });
    await new Promise((r) => setImmediate(r));

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/incorrect email or password/i);
    expect(err.statusCode).toBe(401);
  });

  it("should prevent login with an incorrect password", async () => {
    const req = mockRequest({
      body: {
        email: "valid@example.com",
        password: "wrongPassword123",
      },
    });
    const res = mockResponse();
    const next = jest.fn();

    const mockUser = {
      id: 1,
      email: "valid@example.com",
      passwordHash: "hashedpassword",
      correctPassword: jest.fn().mockResolvedValue(false),
    };

    jest.spyOn(Users, "findOne").mockResolvedValue(mockUser);

    await new Promise((resolve) => {
      authController.login(req, res, (...args) => {
        next(...args);
        resolve();
      });
    });
    await new Promise((r) => setImmediate(r));

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/incorrect email or password/i);
    expect(err.statusCode).toBe(401);
  });
  
  // --- Validate Token Tests ---
  xit("should reject when no token is provided", async () => {});

  xit("should mock jwt.verify to resolve provided token in headers", async () => {});

  xit("should mock jwt.verify to resolve provided token in cookies", async () => {});

  xit("should mock jwt.verify to reject with an error for expired or malformed tokens", async () => {});

  // --- Protect Tests ---
  xit("should call AppError when a user is not logged in", async () => {});

  xit("should throw an error when verifying token if not logged in", async () => {});

  xit("should mock Users.findByPk to return null after token is decoded", () => {});

  xit("should mock changedPasswordAfter a token has been issues, signaling to log in again", () => {});

  xit("should mock a successful access into protected route", () => {});

  // --- Restrictto Tests ---
  xit("should throw next AppError when req.user is not set", async () => {});

  xit("should throw next AppError when a client tries to access an artist route", () => {});

  xit("should allow an artist to access an artist route", () => {});

  // --- ForgotPassword Tests ---
  xit("should call next AppError when there is no user matching provided email", async () => {});

  xit("should mock successful createPasswordResetToken and email send", async () => {
    // Cant implement yet, email logic not set up
  });

  xit("should mock email sending failure", async () => {
    // Cant implement yet, email logic not set up
  });

  // --- RequestPasswordChange Tests ---
  xit("should call next AppError when no user is logged in", async () => {});

  xit("should call next AppError when user cannot be found", async () => {});

  xit("should call res.status(200).json(...) when successful", async () => {});

  xit("should fail to send an email when passwordResetToken and passwordResetExpires are undefined", async () => {
    // Cant implement yet, email logic not set up
  });

  // --- ResetPassword Tests ---
  xit("should call next AppError when passwordResetToken is invalid or expired", async () => {});

  xit("should error when req.body.password is missing", async () => {});

  xit("should successfully reset a users password", async () => {});

  // --- UpdatePassword Tests ---
  xit("should call next AppError when req.user is not set", async () => {});

  xit("should call next AppError when user.correctPassword is false", async () => {});

  xit("should send error when req.body.password is missing, might be caught by model validation", async () => {});

  xit("should successfully update password", async () => {});
});
