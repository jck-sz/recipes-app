# Recipes App

This repository contains a Node.js backend API (`app` folder) and a simple Angular frontend (`frontend` folder) for browsing recipes.

## Backend
The backend exposes REST endpoints for categories and recipes. Run it with:

```bash
cd app
npm install # requires network
npm start
```

## Frontend
The Angular frontend allows browsing recipes by category. To start it:

```bash
cd frontend
npm install # requires network
npm start
```

The frontend expects the backend API at `http://localhost:3000`.
