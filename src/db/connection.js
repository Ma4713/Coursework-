const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "db",
  user: "root",
  password: "password",
  database: "studybuddy",
});

function connectWithRetry() {
  connection.connect((err) => {
    if (err) {
      console.error(
        "Database connection failed, retrying in 5 seconds...",
        err.message,
      );
      setTimeout(connectWithRetry, 5000);
    } else {
      console.log("Connected to MySQL database");
    }
  });
}

connectWithRetry();

module.exports = connection;
