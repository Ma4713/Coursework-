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

// User profile route
app.get("/users/:id", (req, res) => {
  const userId = req.params.id;

  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching user");
      }

      if (results.length === 0) {
        return res.send("User not found");
      }

      res.render("profile", { user: results[0] });
    },
  );
});

app.get("/sessions", (req, res) => {
  connection.query(
    `
    SELECT sessions.*, users.name AS mentor_name, subjects.name AS subject_name
    FROM sessions
    JOIN users ON sessions.mentor_id = users.id
    JOIN subjects ON sessions.subject_id = subjects.id
  `,
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching sessions");
      }

      console.log("SESSIONS RESULTS:", results);
      res.render("sessions", { sessions: results });
    },
  );
});

// Start server
app.listen(3000, () => {
  console.log("Study Buddy running on http://localhost:3000");
});
