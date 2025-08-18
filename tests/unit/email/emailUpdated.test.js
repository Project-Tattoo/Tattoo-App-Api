const EmailUpdated = require("./../../../email/classes/emailUpdated");
const Email = require("./../../../email/classes/email");

describe("EmailUpdated", () => {
  let emailUpdatedInstance;
  let mockSend;

  beforeEach(() => {
    mockSend = jest.spyOn(Email.prototype, "send").mockResolvedValue();

    emailUpdatedInstance = new EmailUpdated({
      recipient: "test@example.com",
      firstName: "Test",
      newEmail: "newTest@example.com",
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("should set firstName and newEmail and call send with correct args", async () => {
    await emailUpdatedInstance.sendEmailUpdated();
    expect(mockSend).toHaveBeenCalledWith(
      "emailUpdated",
      "Your email has been updated",
      { firstName: "Test", newEmail: "newTest@example.com" }
    );
  });

  it("should store the correct recipient, firstName and newEmail", () => {
    expect(emailUpdatedInstance.to).toBe("test@example.com");
    expect(emailUpdatedInstance.firstName).toBe("Test");
    expect(emailUpdatedInstance.newEmail).toBe("newTest@example.com");
  });
});
