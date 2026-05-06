# Study Buddy

Study Buddy is a full-stack peer-support platform designed for university students to connect, collaborate, and support each other academically.

The platform allows students to:

* Create accounts and log in securely
* Browse student profiles
* Create and join study sessions
* Share online meeting links (Zoom / Teams / Google Meet)
* Send study support requests to other students
* Manage personal profiles and bios

The system also includes a separate administrator dashboard for managing platform activity.

---

# Features

## Student Features

* User registration and login
* Session-based authentication
* Student dashboard
* Edit personal profile and bio
* Browse other student profiles
* View mentors and learners
* Create study sessions
* Join study sessions
* Add online meeting links
* Send study requests to other users
* View incoming requests
* Search study sessions

## Administrator Features

* Secure admin login
* Separate admin dashboard
* View all users
* View all sessions
* Delete users
* Delete sessions
* View study requests
* Platform overview statistics

---

# Technologies Used

## Frontend

* Pug Template Engine
* HTML5
* CSS3

## Backend

* Node.js
* Express.js

## Database

* MySQL
* phpMyAdmin

## Authentication

* express-session
* bcrypt

## Containerisation

* Docker
* Docker Compose

---

# System Architecture

The application follows a standard full-stack architecture:

* Frontend rendered using Pug templates
* Express.js handles routing and business logic
* MySQL stores application data
* Docker containers manage application services

Services included:

* Node.js application container
* MySQL database container
* phpMyAdmin container

---

# Database Design

Main database entities:

* users
* subjects
* user_subjects
* sessions
* joined_sessions
* study_requests
* feedback

The database supports:

* role-based access
* student mentoring relationships
* study session management
* request tracking
* profile management

---

# Installation and Setup

## Prerequisites

Install:

* Docker Desktop
* Git

---

## Clone Repository

```bash
git clone <repository-url>
cd study-buddy
```

---

## Run the Application

```bash
docker-compose up --build
```

The application will be available at:

```text
http://localhost:3000
```

phpMyAdmin will be available at:

```text
http://localhost:8080
```

---

# Resetting the Database

To completely reset the database and reload all seeded data:

```bash
docker-compose down -v
docker-compose up --build
```

This removes:

* registered users
* created sessions
* requests
* edited profiles
* all stored database data

The database will reload from:

```text
db/init.sql
```

---

# Test Accounts

## Student Account

```text
Email: aung@studybuddy.com
Password: password123
```

## Mentor Account

```text
Email: emily@studybuddy.com
Password: password123
```

## Administrator Account

```text
Email: admin@studybuddy.com
Password: root
```

---

# Important Note

If the application starts before MySQL fully connects, the connection may fail temporarily.

If this happens, restart the app container in a separate terminal:

```bash
docker-compose restart app
```

The system has been tested multiple times and should reconnect successfully.

---

# Project Structure

```text
study-buddy/
│
├── db/
│   └── init.sql
│
├── public/
│   ├── styles.css
│   └── images/
│
├── src/
│   ├── app.js
│   └── db/
│       └── connection.js
│
├── views/
│   ├── admin.pug
│   ├── dashboard.pug
│   ├── index.pug
│   ├── layout.pug
│   ├── login.pug
│   ├── register.pug
│   ├── sessions.pug
│   └── profile.pug
│
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```


---

# Author

Developed as part of coursework for a university software engineering project.

---

# License

This project is for educational use only.
