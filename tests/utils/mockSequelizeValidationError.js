const { Sequelize } = require("sequelize");

function mockSequelizeValidationError(
  errors = [{ message: "Invalid input" }]
) {
  return new Sequelize.ValidationError(
    "Validation error",
    errors.map((err) => ({
      message: err.message,
      type: "Validation error",
    }))
  );
}

module.exports = mockSequelizeValidationError