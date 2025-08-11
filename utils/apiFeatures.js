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
      const parts = key.split('_');
      if (parts.length > 1 && Op[parts[1]]) {
        const operator = parts[1];
        const field = parts[0];
        where[field] = { [Op[operator]]: value };
      } else {
        where[key] = value;
      }
    }

    if (this.providerId) {
      where.providerId = this.providerId;
    }

    this.query = this.model.findAll({ where }); 

    this.findOptions = this.findOptions || {};
    this.findOptions.where = where;

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').map(field => {
        if (field.startsWith('-')) {
          return [field.substring(1), 'DESC'];
        }
        return [field, 'ASC'];
      });
      this.findOptions = this.findOptions || {};
      this.findOptions.order = sortBy;
    } else {
      this.findOptions = this.findOptions || {};
      this.findOptions.order = [['createdAt', 'DESC']]; // Default to newest first
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",");
      this.findOptions = this.findOptions || {};
      this.findOptions.attributes = fields;
    }
    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 50;
    const offset = (page - 1) * limit;

    this.findOptions = this.findOptions || {};
    this.findOptions.offset = offset;
    this.findOptions.limit = limit;

    return this;
  }

  async execute() {
    this.query = this.model.findAll(this.findOptions);
    return await this.query;
  }
}

module.exports = APIFeatures;