"use strict";
const { DataTypes } = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "emailChangeToken", {
      type: DataTypes.STRING,
    });
    await queryInterface.addColumn("users", "emailChangeExpires", {
      type: DataTypes.DATE,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "emailChangeToken");
    await queryInterface.removeColumn("users", "emailChangeExpires");
  },
};
