CREATE DATABASE IF NOT EXISTS studybuddy;
USE studybuddy;

DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS study_requests;
DROP TABLE IF EXISTS joined_sessions;
DROP TABLE IF EXISTS user_subjects;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  course VARCHAR(100),
  year_of_study VARCHAR(20),
  bio TEXT,
  offers_help BOOLEAN DEFAULT FALSE,
  role ENUM('student', 'admin') DEFAULT 'student'
);

CREATE TABLE subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE user_subjects (
  user_id INT NOT NULL,
  subject_id INT NOT NULL,
  type ENUM('needs_help', 'confident_in') NOT NULL,
  PRIMARY KEY (user_id, subject_id, type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  session_time DATETIME,
  location VARCHAR(255),
  meeting_link VARCHAR(255),
  mentor_id INT,
  subject_id INT,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);

CREATE TABLE joined_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  session_id INT NOT NULL,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE study_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  message TEXT,
  status ENUM('pending','accepted','declined') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE feedback (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  rating INT,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (name, email, password_hash, course, year_of_study, bio, offers_help, role) VALUES
('Aung Min', 'aung@studybuddy.com', 'password123', 'BSc Software Engineering', '2', 'Second-year student looking for help with core software engineering concepts.', FALSE, 'student'),
('Emily Carter', 'emily@studybuddy.com', 'password123', 'BSc Software Engineering', '3', 'Third-year student confident in software engineering and willing to help others.', TRUE, 'student'),
('System Admin', 'admin@studybuddy.com', 'root', 'Administration', 'N/A', 'Technical system administrator responsible for maintaining Study Buddy.', FALSE, 'admin');

INSERT INTO subjects (name) VALUES
('Software Engineering'),
('Algorithms'),
('Web Development'),
('Databases');

INSERT INTO user_subjects (user_id, subject_id, type) VALUES
(1, 1, 'needs_help'),
(1, 2, 'needs_help'),
(2, 1, 'confident_in'),
(2, 4, 'confident_in');

INSERT INTO sessions (title, description, subject_id, mentor_id, session_time, location, meeting_link) VALUES
('Software Engineering Fundamentals', 'A session covering the basics of software engineering principles.', 1, 2, '2026-03-15 15:00:00', 'Library Room 2', 'https://teams.microsoft.com/example'),
('Algorithms Revision Group', 'Collaborative revision session for sorting and searching algorithms.', 2, 2, '2026-03-16 14:00:00', 'Online', 'https://zoom.us/example');