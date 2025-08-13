"use strict";
const { DataTypes } = require("sequelize");
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "firstName", {
      type: DataTypes.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn("users", "lastName", {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("user", "firstName");
    await queryInterface.removeColumn("user", "lastName");
  },
};
