const Email = require("./email");

module.exports = class PasswordReset extends Email {
  constructor({ recipient, resetUrl }) {
    super({
      recipient: recipient,
      from: process.env.SENDER_EMAIL,
    });
    this.resetUrl = resetUrl;
  }
  async sendPasswordReset() {
    const subject = "Your password reset link (valid for 10 minutes)";
    const template = "passwordReset";
    const templateVariables = {
      resetUrl: this.resetUrl,
    };
    await this.send(template, subject, templateVariables);
  }
};
