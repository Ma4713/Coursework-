CREATE DATABASE IF NOT EXISTS studybuddy;
USE studybuddy;

DROP TABLE IF EXISTS user_subjects;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  course VARCHAR(100) NOT NULL,
  year_of_study VARCHAR(20) NOT NULL,
  bio TEXT,
  offers_help BOOLEAN DEFAULT FALSE
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
  title VARCHAR(150) NOT NULL,
  description TEXT,
  subject_id INT NOT NULL,
  mentor_id INT NOT NULL,
  session_time DATETIME,
  location VARCHAR(120),
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (mentor_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO users (name, course, year_of_study, bio, offers_help) VALUES
('Aung Min', 'BSc Software Engineering', '2', 'Second-year student looking for help with core software engineering concepts.', FALSE),
('Emily Carter', 'BSc Software Engineering', '3', 'Final-year student confident in software engineering and willing to help others.', TRUE);

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

INSERT INTO sessions (title, description, subject_id, mentor_id, session_time, location) VALUES
('Software Engineering Fundamentals', 'A session covering the basics of software engineering principles.', 1, 2, '2026-03-15 15:00:00', 'Library Room 2'),
('Algorithms Revision Group', 'Collaborative revision session for sorting and searching algorithms.', 2, 2, '2026-03-16 14:00:00', 'Online');