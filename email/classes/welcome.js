const Email = require("./../utils/email");

module.exports = class Welcome extends Email {
  constructor({ recipient, firstName }) {
    super({
      recipient: recipient,
      from: process.env.PROD_SENDER_EMAIL,
    });
    this.firstName = firstName;
    this.loginUrl = "localhost:3000/login";
  }

  async sendWelcome() {
    const subject = "Welcome to AppName";
    const template = "welcome";
    const templateVariables = {
      firstName: this.firstName,
      loginUrl: this.loginUrl,
    };
    await this.send(template, subject, templateVariables);
  }
};
