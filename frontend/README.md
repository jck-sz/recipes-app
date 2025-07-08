# Frontend

This folder contains a minimal Angular application that fetches recipes from the API.
It does not use any build tools – Angular libraries are loaded from a CDN and
TypeScript is transpiled in the browser using SystemJS.

## Prerequisites

- The backend API should be running (see `../app`). By default it listens on
  `http://localhost:3000`.
- Node.js installed locally (for running a lightweight static server).

## Running the Frontend

1. Start the backend API:
   ```bash
   cd ../app
   cp .env.example .env        # adjust settings if needed
   npm install                 # first time only
   npm start
   ```
2. In another terminal, serve this folder:
   ```bash
   cd ../frontend
   npx http-server -p 3001
   ```
   Any simple static server will work (e.g. `python3 -m http.server 3001`).

3. Open `http://localhost:3001` in your browser. You should see a list of recipe
   titles loaded from the backend.

### Changing the API URL

If your backend runs on a different host or port, update `API_BASE_URL` in
`app/recipe.service.ts`.
