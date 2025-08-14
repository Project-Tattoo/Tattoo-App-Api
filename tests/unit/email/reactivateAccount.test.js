const ReactivateAccount = require("../../../email/classes/reactivateAccount");
const Email = require("../../../email/classes/email");

describe("ReactivateAccount", () => {
  let instance;
  let mockSend;

  beforeEach(() => {
    mockSend = jest.spyOn(Email.prototype, "send").mockResolvedValue();
    instance = new ReactivateAccount({
      recipient: "test@example.com",
      firstName: "Test",
      reactivateUrl: "https://example.com/reactivate",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set firstName and reactivateUrl and call send with correct args", async () => {
    await instance.sendReactivateAccount();
    expect(mockSend).toHaveBeenCalledWith(
      "reactivateAccount",
      "Your account reactivation url",
      { firstName: "Test", reactivateUrl: "https://example.com/reactivate" }
    );
  });

  it("should store the correct recipient, firstName and reactivateUrl", () => {
    expect(instance.to).toBe("test@example.com");
    expect(instance.firstName).toBe("Test");
    expect(instance.reactivateUrl).toBe("https://example.com/reactivate");
  });
});
