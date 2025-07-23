const Sequelize = require("sequelize");
const Op = Sequelize.Op;

class APIFeatures {
  constructor(model, queryString, providerId) {
    this.model = model;
    this.queryString = queryString;
    this.providerId = providerId;
    this.query = model.findAll();
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let where = {};
    for (const [key, value] of Object.entries(queryObj)) {
      if (key.startsWith("")) {
        const operator = key.split("_")[1];
        const field = key.split("_")[0];
        where[field] = { [Op[operator]]: value };
      } else {
        where[key] = value;
      }
    }

    if (this.providerId) {
      where.providerId = this.providerId;
    }

    this.query = this.query.where(where);
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.attributes(fields);
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const offset = (page - 1) * limit;
    this.query = this.query.off(offset).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;