const Email = require('./email')

module.exports = class PasswordChange extends Email {
    constructor({recipient, resetUrl}) {
        super({
            recipient: recipient,
            from: process.env.SENDER_EMAIL
        })
        this.resetUrl = resetUrl
    }

    async sendPasswordChange() {
        const subject = "Your password change link (valid for 10 minutes)";
        const template = "passwordChange";
        const templateVariables = {
            resetUrl: this.resetUrl
        }
        await this.send(template, subject, templateVariables)
    }
}