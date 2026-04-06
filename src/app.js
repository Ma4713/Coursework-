const express = require("express");
const path = require("path");
const connection = require("./db/connection");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.render("index", { title: "Home", activePage: "home" });
});

app.get("/users", (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error(err);
      return res.send("Error fetching users");
    }

    res.render("users", {
      users: results,
      title: "Users",
      activePage: "users",
    });
  });
});

app.get("/users/:id", (req, res) => {
  const userId = req.params.id;

  connection.query(
    `
    SELECT users.*, subjects.name AS subject_name, user_subjects.type
    FROM users
    LEFT JOIN user_subjects ON users.id = user_subjects.user_id
    LEFT JOIN subjects ON user_subjects.subject_id = subjects.id
    WHERE users.id = ?
    `,
    [userId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching user");
      }

      if (results.length === 0) {
        return res.send("User not found");
      }

      res.render("profile", {
        user: results,
        title: results[0].name,
        activePage: "users",
      });
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

      res.render("sessions", {
        sessions: results,
        title: "Sessions",
        activePage: "sessions",
      });
    },
  );
});

app.get("/sessions/:id", (req, res) => {
  const sessionId = req.params.id;

  connection.query(
    `
    SELECT sessions.*, users.name AS mentor_name, users.id AS mentor_user_id, subjects.name AS subject_name
    FROM sessions
    JOIN users ON sessions.mentor_id = users.id
    JOIN subjects ON sessions.subject_id = subjects.id
    WHERE sessions.id = ?
    `,
    [sessionId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching session");
      }

      if (results.length === 0) {
        return res.send("Session not found");
      }

      res.render("session_detail", {
        session: results[0],
        title: results[0].title,
        activePage: "sessions",
      });
    },
  );
});

app.listen(3000, () => {
  console.log("Study Buddy running on http://localhost:3000");
});
