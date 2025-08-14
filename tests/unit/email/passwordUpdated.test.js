const PasswordUpdated = require("../../../email/classes/passwordUpdated");
const Email = require("../../../email/classes/email");

describe("PasswordUpdated", () => {
  let instance;
  let mockSend;

  beforeEach(() => {
    mockSend = jest.spyOn(Email.prototype, "send").mockResolvedValue();
    instance = new PasswordUpdated({
      recipient: "test@example.com",
      firstName: "Test",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set firstName and call send with correct args", async () => {
    await instance.sendPasswordUpdated();
    expect(mockSend).toHaveBeenCalledWith(
      "passwordUpdated",
      "Your password has been changed",
      { firstName: "Test" }
    );
  });

  it("should store the correct recipient and firstName", () => {
    expect(instance.to).toBe("test@example.com");
    expect(instance.firstName).toBe("Test");
  });
});
