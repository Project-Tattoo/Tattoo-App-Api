const PasswordReset = require("../../../email/classes/passwordReset");
const Email = require("../../../email/classes/email");

describe("PasswordReset", () => {
  let instance;
  let mockSend;

  beforeEach(() => {
    mockSend = jest.spyOn(Email.prototype, "send").mockResolvedValue();
    instance = new PasswordReset({
      recipient: "test@example.com",
      resetUrl: "https://example.com/reset",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set resetUrl and call send with correct args", async () => {
    await instance.sendPasswordReset();
    expect(mockSend).toHaveBeenCalledWith(
      "passwordReset",
      "Your password reset link (valid for 10 minutes)",
      { resetUrl: "https://example.com/reset" }
    );
  });

  it("should store the correct recipient and resetUrl", () => {
    expect(instance.to).toBe("test@example.com");
    expect(instance.resetUrl).toBe("https://example.com/reset");
  });
});
