const mysql = require("mysql2");

let connection;

// Railway provides MYSQL_URL or DATABASE_URL as a connection string
const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

if (connectionUrl) {
  connection = mysql.createPool(connectionUrl);
} else {
  connection = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
  });
}

module.exports = connection.promise();