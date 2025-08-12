const Email = require("./email");

module.exports = class EmailChange extends Email {
  constructor({ recipient, secureChangeUrl }) {
    super({
      recipient: recipient,
      from: process.env.SENDER_EMAIL,
    });
    this.secureChangeUrl = secureChangeUrl;
  }

  async sendEmailChange() {
    const subject = "Your email change link (valid for 10 minutes)";
    const template = "emailChange";
    const templateVariables = {
      secureChangeUrl: this.secureChangeUrl,
    };
    await this.send(template, subject, templateVariables);
  }
};
