const Email = require("./email");

module.exports = class ReactivateAccount extends Email {
  constructor({ recipient, firstName, reactivateUrl }) {
    super({
      recipient: recipient,
      from: process.env.SENDER_EMAIL,
    });
    this.firstName = firstName;
    this.reactivateUrl = reactivateUrl;
  }

  async sendReactivateAccount() {
    const subject = "Your account reactivation url";
    const template = "reactivateAccount";
    const templateVariables = {
      firstName: this.firstName,
      reactivateUrl: this.reactivateUrl,
    };
    await this.send(template, subject, templateVariables);
  }
};
