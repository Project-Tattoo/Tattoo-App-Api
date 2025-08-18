"use strict";
const { DataTypes } = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "reactivateAccountToken", {
      type: DataTypes.STRING,
    });
    await queryInterface.addColumn("users", "reactivateAccountExpires", {
      type: DataTypes.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "reactivateAccountToken");
    await queryInterface.removeColumn("users", "reactivateAccountExpires");
  },
};
