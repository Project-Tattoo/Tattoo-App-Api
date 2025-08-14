const EmailChange = require("./../../../email/classes/emailChange");
const Email = require("./../../../email/classes/email");

describe("EmailChange", () => {
  let emailChangeInstance;
  let mockSend;

  beforeEach(() => {
    mockSend = jest.spyOn(Email.prototype, "send").mockResolvedValue();

    emailChangeInstance = new EmailChange({
      recipient: "test@example.com",
      secureChangeUrl: "https://example.com/change-email",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set secureChangeUrl and call send with correct args", async () => {
    await emailChangeInstance.sendEmailChange();

    expect(mockSend).toHaveBeenCalledWith(
      "emailChange",
      "Your email change link (valid for 10 minutes)",
      { secureChangeUrl: "https://example.com/change-email" }
    );
  });

  it("should store the correct recipient and secureChangeUrl", () => {
    expect(emailChangeInstance.secureChangeUrl).toBe("https://example.com/change-email");
    expect(emailChangeInstance.to).toBe("test@example.com");
  });
});