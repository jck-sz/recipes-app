# FODMAP Recipe API

This project contains a simple REST API for managing recipes. The code lives inside the `app` directory and uses PostgreSQL for storage.

## Prerequisites

- **Node.js** v18 or newer
- **npm**
- **PostgreSQL** running locally (or update `DATABASE_URL` in the `.env` file)

## Setup

1. Install dependencies:
   ```bash
   npm install          # install root dependencies (for tests and shared packages)
   npm install --prefix app
   ```
2. Prepare environment variables:
   ```bash
   cd app
   cp .env.example .env
   # edit .env to match your database credentials
   ```
3. Create the database schema. With psql installed you can run:
   ```bash
   psql -U <db_user> -d <db_name> -f ../migrations/init.sql
   ```
   This step creates the tables used by the API.
4. Start the server:
   ```bash
   npm start
   ```
   By default the API listens on port `3000`.

## Docker (optional)

If you prefer using Docker, check the [`docker/README.md`](docker/README.md) directory. Running the setup script there will create the `.env` file and start PostgreSQL and the API inside containers.

