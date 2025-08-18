const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");
const Email = require("./../../../email/classes/email");

jest.mock("nodemailer");
jest.mock("pug");
jest.mock("html-to-text");

describe("Email class", () => {
  let emailInstance;
  let mockTransport;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransport = { sendMail: jest.fn().mockResolvedValue(true) };
    nodemailer.createTransport.mockReturnValue(mockTransport);

    pug.renderFile.mockReturnValue("<h1>Hello World</h1>");

    htmlToText.convert.mockReturnValue("Hello World");

    emailInstance = new Email({ recipient: "test@example.com" });
  });

  it("should store recipient and sender on creation", () => {
    expect(emailInstance.to).toBe("test@example.com");
    expect(emailInstance.from).toBe(process.env.SENDER_EMAIL);
  });

  it("newTransport() should call nodemailer.createTransport with correct config", () => {
    emailInstance.newTransport();
    expect(nodemailer.createTransport).toHaveBeenCalledWith({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  });

  it("send() should render template and send email", async () => {
    await emailInstance.send("welcome", "Welcome!", { username: "Evan" });

    expect(pug.renderFile).toHaveBeenCalledWith(
      expect.stringContaining("/templates/welcome.pug"),
      expect.objectContaining({
        username: "Evan",
        from: process.env.SENDER_EMAIL,
        to: "test@example.com",
        subject: "Welcome!",
      })
    );

    expect(htmlToText.convert).toHaveBeenCalledWith("<h1>Hello World</h1>");

    expect(mockTransport.sendMail).toHaveBeenCalledWith({
      from: process.env.SENDER_EMAIL,
      to: "test@example.com",
      subject: "Welcome!",
      html: "<h1>Hello World</h1>",
      text: "Hello World",
    });
  });

  it("should work when templateVariables is omitted", async () => {
    await emailInstance.send("welcome", "Welcome!");

    expect(pug.renderFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        from: process.env.SENDER_EMAIL,
        to: "test@example.com",
        subject: "Welcome!",
      })
    );

    expect(mockTransport.sendMail).toHaveBeenCalled();
  });
});
