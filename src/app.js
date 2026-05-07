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
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== "student") {
    return res.status(403).send("Student access only");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).send("Access denied");
  }
  next();
}

app.get("/", (req, res) => {
  res.render("index", { title: "Home", activePage: "home" });
});

app.get("/register", (req, res) => {
  res.render("register", { title: "Register", activePage: "register" });
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
  res.render("login", { title: "Login", activePage: "login" });
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
      let passwordMatch = false;

      if (user.password_hash.startsWith("$2")) {
        passwordMatch = await bcrypt.compare(password, user.password_hash);
      } else {
        passwordMatch = password === user.password_hash;
      }

      if (!passwordMatch) {
        return res.send("Invalid email or password");
      }

      req.session.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      if (user.role === "admin") return res.redirect("/admin");
      res.redirect("/dashboard");
    },
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

app.get("/dashboard", requireStudent, (req, res) => {
  res.render("dashboard", { title: "Dashboard", activePage: "dashboard" });
});

app.get("/profile/edit", requireStudent, (req, res) => {
  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [req.session.user.id],
    (err, results) => {
      if (err) return res.send("Error loading profile");

      res.render("edit_profile", {
        title: "Edit Profile",
        activePage: "dashboard",
        user: results[0],
      });
    },
  );
});

app.post("/profile/edit", requireStudent, (req, res) => {
  const { bio, course, year_of_study, offers_help } = req.body;

  connection.query(
    `UPDATE users SET bio = ?, course = ?, year_of_study = ?, offers_help = ? WHERE id = ?`,
    [bio, course, year_of_study, offers_help === "on", req.session.user.id],
    (err) => {
      if (err) return res.send("Error updating profile");
      res.redirect(`/users/${req.session.user.id}`);
    },
  );
});

app.get("/users", requireStudent, (req, res) => {
  connection.query(
    "SELECT * FROM users WHERE role = 'student'",
    (err, results) => {
      if (err) return res.send("Error fetching users");

      res.render("users", {
        users: results,
        title: "Users",
        activePage: "users",
      });
    },
  );
});

app.get("/users/:id", requireStudent, (req, res) => {
  connection.query(
    `
    SELECT users.*, subjects.name AS subject_name, user_subjects.type
    FROM users
    LEFT JOIN user_subjects ON users.id = user_subjects.user_id
    LEFT JOIN subjects ON user_subjects.subject_id = subjects.id
    WHERE users.id = ? AND users.role = 'student'
    `,
    [req.params.id],
    (err, results) => {
      if (err) return res.send("Error fetching user");
      if (results.length === 0) return res.send("User not found");

      res.render("profile", {
        user: results,
        title: results[0].name,
        activePage: "users",
      });
    },
  );
});

app.post("/users/:id/request", requireStudent, (req, res) => {
  const receiverId = req.params.id;
  const { message } = req.body;

  connection.query(
    `INSERT INTO study_requests (sender_id, receiver_id, message) VALUES (?, ?, ?)`,
    [req.session.user.id, receiverId, message],
    (err) => {
      if (err) return res.send("Error sending request");
      res.redirect(`/users/${receiverId}`);
    },
  );
});

app.get("/requests", requireStudent, (req, res) => {
  connection.query(
    `
    SELECT study_requests.*, users.name AS sender_name
    FROM study_requests
    JOIN users ON study_requests.sender_id = users.id
    WHERE receiver_id = ?
    ORDER BY created_at DESC
    `,
    [req.session.user.id],
    (err, results) => {
      if (err) return res.send("Error loading requests");

      res.render("requests", {
        title: "Requests",
        activePage: "requests",
        requests: results,
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
      if (err) return res.send("Error fetching sessions");

      res.render("sessions", {
        sessions: results,
        search,
        title: "Sessions",
        activePage: "sessions",
      });
    },
  );
});

app.get("/sessions/new", requireStudent, (req, res) => {
  connection.query("SELECT * FROM subjects", (err, subjects) => {
    if (err) return res.send("Error loading subjects");

    res.render("new_session", {
      title: "Create Session",
      activePage: "sessions",
      subjects,
    });
  });
});

app.post("/sessions/new", requireStudent, (req, res) => {
  const {
    title,
    description,
    subject_id,
    session_time,
    location,
    meeting_link,
  } = req.body;

  connection.query(
    `
    INSERT INTO sessions (title, description, subject_id, mentor_id, session_time, location, meeting_link)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      title,
      description,
      subject_id,
      req.session.user.id,
      session_time,
      location,
      meeting_link,
    ],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error creating session");
      }
      res.redirect("/sessions");
    },
  );
});

app.get("/sessions/:id", requireStudent, (req, res) => {
  const sessionId = req.params.id;

  connection.query(
    `
    SELECT sessions.*, 
           users.name AS mentor_name,
           users.id AS mentor_user_id,
           subjects.name AS subject_name
    FROM sessions
    JOIN users ON sessions.mentor_id = users.id
    JOIN subjects ON sessions.subject_id = subjects.id
    WHERE sessions.id = ?
    `,
    [sessionId],
    (err, sessionResults) => {
      if (err) {
        console.error(err);
        return res.send("Error fetching session");
      }

      if (sessionResults.length === 0) {
        return res.send("Session not found");
      }

      connection.query(
        `
        SELECT feedback.*, users.name AS user_name
        FROM feedback
        JOIN users ON feedback.user_id = users.id
        WHERE feedback.session_id = ?
        ORDER BY feedback.created_at DESC
        `,
        [sessionId],
        (err, feedbackResults) => {
          if (err) {
            console.error(err);
            return res.send("Error fetching feedback");
          }

          res.render("session_detail", {
            session: sessionResults[0],
            feedback: feedbackResults,
            title: sessionResults[0].title,
            activePage: "sessions",
          });
        },
      );
    },
  );
});

app.get("/sessions/:id/join", requireStudent, (req, res) => {
  connection.query(
    "INSERT INTO joined_sessions (user_id, session_id) VALUES (?, ?)",
    [req.session.user.id, req.params.id],
    (err) => {
      if (err) return res.send("Error joining session");
      res.redirect(`/sessions/${req.params.id}`);
    },
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
            "SELECT COUNT(*) AS totalRequests FROM study_requests",
            (err, requestsResult) => {
              if (err) return res.send("Error loading requests count");

              connection.query(
                "SELECT COUNT(*) AS totalFeedback FROM feedback",
                (err, feedbackResult) => {
                  if (err) return res.send("Error loading feedback count");

                  res.render("admin", {
                    title: "Admin Dashboard",
                    activePage: "admin",
                    totalUsers: usersResult[0].totalUsers,
                    totalSessions: sessionsResult[0].totalSessions,
                    totalRequests: requestsResult[0].totalRequests,
                    totalFeedback: feedbackResult[0].totalFeedback,
                  });
                },
              );
            },
          );
        },
      );
    },
  );
});

app.get("/admin/users", requireAdmin, (req, res) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) return res.send("Error loading users");

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
      if (err) return res.send("Error loading sessions");

      res.render("admin_sessions", {
        title: "Manage Sessions",
        sessions: results,
        activePage: "admin",
      });
    },
  );
});

app.post("/admin/users/:id/delete", requireAdmin, (req, res) => {
  const userId = req.params.id;

  if (Number(userId) === req.session.user.id) {
    return res.send("You cannot delete your own admin account.");
  }

  connection.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
    if (err) {
      console.error(err);
      return res.send("Error deleting user");
    }

    res.redirect("/admin/users");
  });
});

app.post("/admin/sessions/:id/delete", requireAdmin, (req, res) => {
  const sessionId = req.params.id;

  connection.query("DELETE FROM sessions WHERE id = ?", [sessionId], (err) => {
    if (err) {
      console.error(err);
      return res.send("Error deleting session");
    }

    res.redirect("/admin/sessions");
  });
});

app.get("/admin/requests", requireAdmin, (req, res) => {
  connection.query(
    `
    SELECT study_requests.*, 
           sender.name AS sender_name,
           receiver.name AS receiver_name
    FROM study_requests
    JOIN users sender ON study_requests.sender_id = sender.id
    JOIN users receiver ON study_requests.receiver_id = receiver.id
    ORDER BY study_requests.created_at DESC
    `,
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error loading requests");
      }

      res.render("admin_requests", {
        title: "Manage Requests",
        activePage: "admin",
        requests: results,
      });
    },
  );
});

app.post("/requests/:id/accept", requireStudent, (req, res) => {
  connection.query(
    "UPDATE study_requests SET status = 'accepted' WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error accepting request");
      }

      res.redirect("/requests");
    },
  );
});

app.post("/requests/:id/decline", requireStudent, (req, res) => {
  connection.query(
    "UPDATE study_requests SET status = 'declined' WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error declining request");
      }

      res.redirect("/requests");
    },
  );
});

app.post("/sessions/:id/feedback", requireStudent, (req, res) => {
  const sessionId = req.params.id;
  const { rating, comment } = req.body;

  connection.query(
    `
    INSERT INTO feedback (session_id, user_id, rating, comment)
    VALUES (?, ?, ?, ?)
    `,
    [sessionId, req.session.user.id, rating, comment],
    (err) => {
      if (err) {
        console.error(err);
        return res.send("Error submitting feedback");
      }

      res.redirect(`/sessions/${sessionId}`);
    },
  );
});

app.get("/admin/feedback", requireAdmin, (req, res) => {
  connection.query(
    `
    SELECT feedback.*, 
           users.name AS user_name,
           sessions.title AS session_title
    FROM feedback
    JOIN users ON feedback.user_id = users.id
    JOIN sessions ON feedback.session_id = sessions.id
    ORDER BY feedback.created_at DESC
    `,
    (err, results) => {
      if (err) {
        console.error(err);
        return res.send("Error loading feedback");
      }

      res.render("admin_feedback", {
        title: "Manage Feedback",
        activePage: "admin",
        feedback: results,
      });
    },
  );
});

app.listen(3000, () => {
  console.log("Study Buddy running on http://localhost:3000");
});
