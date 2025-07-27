require('dotenv').config({ path: `./.env.${process.env.NODE_ENV || 'development'}` });
module.exports = {

  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_DEV,
    host: process.env.DB_HOST_DEV,   
    dialect: 'postgres',
    port: process.env.DB_PORT_DEV,
    logging: console.log,
  },

  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_TEST,
    host: process.env.DB_HOST_TEST,    
    dialect: 'postgres',
    port: process.env.DB_PORT_TEST,
    logging: false, 
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME_PROD, 
    host: process.env.DB_HOST_PROD,     
    dialect: 'postgres',
    port: process.env.DB_PORT_PROD,
    logging: false, 

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false 
      }
    }
  }
};
