const express = require("express");
const path = require("path");
const connection = require("./db/connection");

const app = express();

// PUG setup
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// Home route
app.get("/", (req, res) => {
  res.render("index");
});

// Users route
app.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error(err);
      return res.send("Error fetching users");
    }

    res.render("users", { users: results });
  });
});

// Start server
app.listen(3000, () => {
  console.log("Study Buddy running on http://localhost:3000");
});
