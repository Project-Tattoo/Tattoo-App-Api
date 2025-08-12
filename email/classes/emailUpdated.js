const Email = require("./email");

module.exports = class EmailUpdated extends Email {
  constructor({ recipient, firstName, newEmail}) {
    super({
      recipient: recipient,
      from: process.env.SENDER_EMAIL,
    });
    this.firstName = firstName;
    this.newEmail = newEmail
  }

  async sendEmailUpdated() {
    const subject = "Your email has been updated";
    const template = "emailUpdated";
    const templateVariables = {
      firstName: this.firstName,
      newEmail: this.newEmail
    };
    await this.send(template, subject, templateVariables);
  }
};
