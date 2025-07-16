# conferential-back

This project is a backend API for the Conferential application, built with Node.js, PostgreSQL, and Docker.

# Prerequisites

- Docker (https://www.docker.com/products/docker-desktop/)

- Docker Compose (https://docs.docker.com/compose/)

# Configuration

A .env file is required to define environment variables for the backend. Here's an example of its contents:

```
PORT= 8000
DATABASE_NAME= "DATABASE_NAME"
DATABASE_USER= "DATABASE_USER"
DATABASE_PASS= "DATABASE_PASS"
DATABASE_HOST= "DATABASE_HOST"
DATABASE_PORT= "5432"
JWT_SECRET= "your_jwt_secret"
ALLOWED_ORIGIN="http://localhost:8080"


# Docker

POSTGRES_USER= "DATABASE_USER"
POSTGRES_PASSWORD=  "DATABASE_PASS"
POSTGRES_DB= "DATABASE_DB"
POSTGRES_HOST="db"
```

Create a .env file at the root of the project and copy these lines into it.


# Starting the Application with Docker

In a terminal, at the root of the project, run the following commands:

```
docker compose down -v        (optional, to reset everything)
docker compose up --build
```

This will:

Build the Docker image for the app

Start the PostgreSQL container

Run the initialization script (init.sh)

Apply the database migrations

Automatically create a default admin user

Start the Node.js server at http://localhost:8000