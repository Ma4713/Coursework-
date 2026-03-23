# Study Buddy

Study Buddy is a web app that helps students connect for peer study support.

## Tech Stack
- Node.js + Express
- PUG templates
- MySQL
- Docker

## Running the Application

To start the system, run:

docker-compose up --build

Then open:
- http://localhost:3000 (Study Buddy app)
- http://localhost:8080 (phpMyAdmin)

## Note on Database Connection

In some cases, the application may start before the MySQL database is fully ready, which can cause a temporary connection error.

If this happens, simply run the following command in a separate terminal:

docker-compose restart app

This will reconnect the application to the database.

This behaviour has been tested multiple times and the system works correctly after restarting the app container.
