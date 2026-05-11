const mysql = require("mysql2");

let connection = null;

try {
  // Railway provides MYSQL_URL or DATABASE_URL as a connection string
  const connectionUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;

  if (connectionUrl && !connectionUrl.includes("YOUR_PASSWORD")) {
    connection = mysql.createPool(connectionUrl);
  } else {
    const host = process.env.DB_HOST || process.env.MYSQLHOST;
    const user = process.env.DB_USER || process.env.MYSQLUSER;
    const password = process.env.DB_PASSWORD || process.env.MYSQLPASSWORD;
    const database = process.env.DB_NAME || process.env.MYSQLDATABASE;

    if (host && host !== "localhost") {
      connection = mysql.createPool({
        host,
        port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
        user,
        password,
        database,
      });
    } else {
      console.error("WARNING: No valid database configuration found!");
      // Create a dummy pool that will fail gracefully on queries
      connection = mysql.createPool({
        host: host || "localhost",
        port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
        user: user || "root",
        password: password || "",
        database: database || "notification_system",
      });
    }
  }
} catch (err) {
  console.error("Failed to create DB pool:", err.message);
  connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "notification_system",
  });
}

module.exports = connection.promise();