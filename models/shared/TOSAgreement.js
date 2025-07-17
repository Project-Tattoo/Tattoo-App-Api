const Sequelize = require("sequelize");
const db = require("../../server");

const TOSAgreement = db.define("tosAgreements", {
    userId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    tosVersion: {
        type: Sequelize.TEXT,
        allowNull: false
    },
    agreedAt: {
        type: Sequelize.DATEONLY,
        allowNull: false
    },
    ipAddress: {
        type: Sequelize.TEXT,
        allowNull: false
    }
}, { timestamps: true });

module.exports = TOSAgreement;
