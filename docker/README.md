# FODMAP Application Docker Setup

This directory contains Docker configuration for running the FODMAP Recipe API with PostgreSQL database.

## 🚀 One-Command Setup (Automated)

Just like `npm run dev` but for Docker! No manual password editing required.

### Option 1: Using Node.js (Recommended)
```bash
cd docker
npm run setup
```

### Option 2: Using PowerShell (Windows)
```powershell
cd docker
.\setup.ps1
```

### Option 3: Using Bash (Linux/Mac)
```bash
cd docker
chmod +x setup.sh
./setup.sh
```

**That's it!** The setup script will:
- ✅ Generate secure random passwords automatically
- ✅ Create the `.env` file with CORS configuration
- ✅ Start all Docker services (database + backend)
- ✅ Create database user with proper permissions
- ✅ Wait for services to be healthy
- ✅ Show you the endpoints when ready
- ✅ Enable hot reload for development

## 📋 NPM Scripts (Easy Management)

After setup, use these simple commands:

```bash
# Development mode (shows logs in foreground)
npm run dev

# Background mode (detached)
npm run dev:detached

# View logs
npm run logs

# Stop services
npm run stop

# Restart services
npm run restart

# Check status
npm run status

# Clean everything (removes data!)
npm run clean

# Rebuild containers
npm run rebuild

# Access containers
npm run shell:api    # Backend shell
npm run shell:db     # Database shell
```

## 🐳 What's Running in Docker

- **Database (db)**: PostgreSQL 15 with automatic schema initialization
- **Backend API (api)**: Node.js application with hot reload enabled

## 📡 Endpoints

- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Database**: localhost:5432

## 🔥 Development Features

- **Hot Reload**: Code changes automatically restart the backend
- **Volume Mounting**: Your local code is mounted into the container
- **Database Persistence**: Data survives container restarts
- **Automatic Setup**: No manual configuration needed

## Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v

# Rebuild and restart
docker-compose up --build -d

# View container status
docker-compose ps

# Execute commands in containers
docker-compose exec api sh
docker-compose exec db psql -U postgres -d fodmap_db

# View real-time logs
docker-compose logs -f api
```

## Development vs Production

This setup is configured for production use. For development:

1. Change `NODE_ENV=development` in `.env`
2. Add volume mount for live code reloading:
   ```yaml
   volumes:
     - ../app:/app
     - /app/node_modules
   ```

## Troubleshooting

### Common Issues

1. **Database connection issues**:
   - Ensure the database is healthy before the API starts
   - If authentication fails, run: `docker-compose down -v && npm run setup`

2. **Port conflicts**:
   - Backend uses port 3000, database uses port 5432
   - Change ports in docker-compose.yml if these ports are in use

3. **CORS errors from frontend**:
   - Frontend must run on port 3001 (automatically configured)
   - CORS origins are set in `.env` file: `ALLOWED_ORIGINS`

4. **Environment variables not updating**:
   - Stop containers completely: `docker-compose down`
   - Restart: `docker-compose up -d`
   - Environment changes require container restart

5. **Database user creation fails**:
   - The setup script automatically creates `recipes_user`
   - If manual creation needed: `docker-compose exec db psql -U postgres -d fodmap_db`

### Reset Everything
```bash
docker-compose down -v  # Removes all data and volumes
npm run setup           # Recreates everything from scratch
```

## Data Persistence

Database data is stored in Docker volume `postgres_data` and persists between container restarts.
