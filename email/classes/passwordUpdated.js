const Email = require("./email");

module.exports = class PasswordUpdated extends Email {
  constructor({ recipient, firstName}) {
    super({
      recipient: recipient,
      from: process.env.SENDER_EMAIL,
    });
    this.firstName = firstName;
  }

  async sendPasswordUpdated() {
    const subject = "Your password has been changed";
    const template = "passwordUpdated";
    const templateVariables = {
      firstName: this.firstName
    };
    await this.send(template, subject, templateVariables);
  }
};
