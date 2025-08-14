const Welcome = require("../../../email/classes/welcome");
const Email = require("../../../email/classes/email");

describe("Welcome", () => {
  let instance;
  let mockSend;

  beforeEach(() => {
    mockSend = jest.spyOn(Email.prototype, "send").mockResolvedValue();
    instance = new Welcome({
      recipient: "test@example.com",
      firstName: "Test",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set firstName and call send with correct args", async () => {
    await instance.sendWelcome();
    expect(mockSend).toHaveBeenCalledWith(
      "welcome",
      "Welcome to AppName",
      { firstName: "Test", loginUrl: "localhost:3000/login" }
    );
  });

  it("should store the correct recipient and firstName", () => {
    expect(instance.to).toBe("test@example.com");
    expect(instance.firstName).toBe("Test");
    expect(instance.loginUrl).toBe("localhost:3000/login");
  });
});
