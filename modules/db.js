const mysql = require("mysql2/promise");
const config = require("config");

const user = config.get("db_user");
const password = config.get("db_password");
const database = config.get("db_database");
const host = config.get("db_host");

const connection = mysql.createPool({
  host,
  user,
  password,
  database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = connection;
