const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");
const connection = require("./db/connection");

const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "../views"));
app.use(express.static(path.join(__dirname, "../public")));

app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: "studybuddy-secret",
    resave: false,
    saveUninitialized: false,
  }),
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.status(403).send("Student access only");
  }
  next();
}

app.get("/", (req, res) => {
  res.render("index", { title: "Home", activePage: "home" });
});

app.get("/users", requireStudent, (req, res) => {
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

app.get("/register", (req, res) => {
  res.render("register", {
    title: "Register",
    activePage: "register",
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password, course, year_of_study } = req.body;

  const passwordHash = await bcrypt.hash(password, 10);

  connection.query(
    `INSERT INTO users (name, email, password_hash, course, year_of_study, bio, offers_help, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      name,
      email,
      passwordHash,
      course,
      year_of_study,
      "New Study Buddy user.",
      false,
      "student",
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error creating account");
      }

      res.redirect("/login");
    },
  );
});


app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    activePage: "login",
  });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  connection.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Login error");
      }

      if (results.length === 0) {
        return res.send("Invalid email or password");
      }

      const user = results[0];
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        return res.send("Invalid email or password");
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      if (user.role === "admin") {
        return res.redirect("/admin");
      }

      res.redirect("/");
    },
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/users/:id", requireStudent, (req, res) => {
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

app.get("/sessions", requireStudent, (req, res) => {
  const search = req.query.search || "";

  connection.query(
    `
    SELECT sessions.*, users.name AS mentor_name, subjects.name AS subject_name
    FROM sessions
    JOIN users ON sessions.mentor_id = users.id
    JOIN subjects ON sessions.subject_id = subjects.id
    WHERE sessions.title LIKE ? OR subjects.name LIKE ?
    `,
    [`%${search}%`, `%${search}%`],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching sessions");
      }

      res.render("sessions", {
        sessions: results,
        search,
        title: "Sessions",
        activePage: "sessions",
      });
    },
  );
});

app.get("/sessions/:id", requireStudent, (req, res) => {
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

app.get("/sessions/:id/join", requireStudent, (req, res) => {
  const sessionId = req.params.id;

  connection.query(
    `
    SELECT sessions.*, subjects.name AS subject_name
    FROM sessions
    JOIN subjects ON sessions.subject_id = subjects.id
    WHERE sessions.id = ?
    `,
    [sessionId],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error joining session");
      }

      if (results.length === 0) {
        return res.send("Session not found");
      }

      res.render("join_session", {
        session: results[0],
        title: "Join Session",
        activePage: "sessions",
      });
    }
  );
});

app.get("/admin", requireAdmin, (req, res) => {
  connection.query(
    "SELECT COUNT(*) AS totalUsers FROM users",
    (err, usersResult) => {
      if (err) return res.send("Error loading users count");

      connection.query(
        "SELECT COUNT(*) AS totalSessions FROM sessions",
        (err, sessionsResult) => {
          if (err) return res.send("Error loading sessions count");

          connection.query(
            "SELECT COUNT(*) AS totalSubjects FROM subjects",
            (err, subjectsResult) => {
              if (err) return res.send("Error loading subjects count");

              res.render("admin", {
                title: "Admin Dashboard",
                activePage: "admin",
                totalUsers: usersResult[0].totalUsers,
                totalSessions: sessionsResult[0].totalSessions,
                totalSubjects: subjectsResult[0].totalSubjects,
              });
            },
          );
        },
      );
    },
  );
});

app.get("/admin/users", requireAdmin, (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error(err);
      return res.send("Error loading users");
    }

    res.render("admin_users", {
      title: "Manage Users",
      users: results,
      activePage: "admin",
    });
  });
});

app.get("/admin/sessions", requireAdmin, (req, res) => {
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
        return res.send("Error loading sessions");
      }

      res.render("admin_sessions", {
        title: "Manage Sessions",
        sessions: results,
        activePage: "admin",
      });
    },
  );
});

app.listen(3000, () => {
  console.log("Study Buddy running on http://localhost:3000");
});
