const { Sequelize } = require("sequelize");

function mockSequelizeUniqueConstraintError(
  field = "email",
  value = "duplicate@example.com"
) {
  return new Sequelize.UniqueConstraintError({
    message: "Validation error",
    errors: [
      {
        message: `${field} must be unique`,
        type: "unique violation",
        path: field,
        value,
      },
    ],
    fields: {
      [field]: value,
    },
  });
}

module.exports = mockSequelizeUniqueConstraintError