# FODMAP Recipe App - Development Setup

This guide explains how to set up and run the FODMAP Recipe Application for development.

## 🚀 Quick Start

### Option 1: NPM Scripts (Recommended)

```bash
# Start both backend and frontend
npm run dev

# Start frontend only (for testing without backend)
npm run dev:frontend

# Simple batch file versions (Windows)
npm run dev:simple
npm run dev:frontend-simple
```

### Option 2: Direct Script Execution

```bash
# PowerShell (Windows)
.\start-dev.ps1
.\start-dev.ps1 -FrontendOnly

# Batch file (Windows - simpler)
.\start-dev.bat
.\start-dev.bat frontend

# Bash (Linux/Mac)
./start-dev.sh
./start-dev.sh --frontend-only
```

### Option 2: Manual Setup

```bash
# Start backend with Docker
cd docker
npm run setup
cd ..

# Start frontend (in a new terminal)
cd frontend
npx http-server -p 3001
```

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **Docker Desktop** (for database)
- **PowerShell** (Windows) or **Bash** (Linux/Mac)

## 🛠️ Available Commands

### Main Commands
- `npm run dev` - Start both backend and frontend
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run dev:no-docker` - Start without Docker (requires manual DB)
- `npm run setup` - Setup Docker environment only

### Script Options (PowerShell)
```powershell
.\start-dev.ps1                 # Start both services
.\start-dev.ps1 -FrontendOnly   # Frontend only
.\start-dev.ps1 -BackendOnly    # Backend only
.\start-dev.ps1 -SkipDocker     # Skip Docker setup
.\start-dev.ps1 -Help           # Show help
```

### Script Options (Bash/Linux)
```bash
./start-dev.sh                    # Start both services
./start-dev.sh --frontend-only    # Frontend only
./start-dev.sh --backend-only     # Backend only
./start-dev.sh --skip-docker      # Skip Docker setup
./start-dev.sh --help             # Show help
```

## 🌐 Service URLs

Once started, the following services will be available:

- **Frontend**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/admin.html
- **Backend API**: http://localhost:3000
- **API Health**: http://localhost:3000/health

## 🔑 Admin Access

- **Password**: `Dupadupa123`
- **Features**: Add/edit/delete recipes and ingredients

## 🔧 Troubleshooting

### Authentication Failed: Failed to fetch

This error occurs when the backend is not running. The admin panel now handles this gracefully:

1. **With Backend Running**: Full functionality with real-time data
2. **Without Backend**: Offline mode with limited functionality

### Solutions:

#### Option 1: Start Backend Service
```bash
# Make sure Docker is running, then:
npm run dev:backend
# or
cd docker && npm run setup
```

#### Option 2: Use Offline Mode
- Enter password `Dupadupa123` when backend is down
- Limited functionality available for testing UI

### Common Issues

#### Docker Not Running
```
❌ Docker is not running!
💡 Please start Docker Desktop and try again
```
**Solution**: Start Docker Desktop, then run `npm run dev`

#### Port Already in Use
```
❌ Port 3000/3001 already in use
```
**Solution**: 
- Kill existing processes: `npx kill-port 3000 3001`
- Or use different ports in the scripts

#### Permission Denied (Linux/Mac)
```
❌ Permission denied: ./start-dev.sh
```
**Solution**: `chmod +x start-dev.sh`

## 🏗️ Development Workflow

### 1. Initial Setup
```bash
git clone <repository>
cd fodmap
npm run dev
```

### 2. Daily Development
```bash
# Start development environment
npm run dev

# Make changes to code
# Frontend changes: Refresh browser
# Backend changes: Restart backend service
```

### 3. Testing
```bash
# Run tests
npm test

# Test admin panel
# Go to http://localhost:3001/admin.html
# Password: Dupadupa123
```

## 📁 Project Structure

```
fodmap/
├── app/                 # Backend API
├── frontend/           # Frontend files
├── docker/            # Docker configuration
├── migrations/        # Database migrations
├── start-dev.ps1     # Windows startup script
├── start-dev.sh      # Linux/Mac startup script
└── package.json      # Project configuration
```

## 🔄 Environment Variables

The startup scripts automatically configure:

- `ADMIN_PASSWORD=Dupadupa123`
- `DATABASE_URL` (Docker configuration)
- `CORS` settings for development
- Database connection settings

## 💡 Tips

1. **Frontend Development**: Changes are reflected immediately
2. **Backend Development**: Restart backend service after changes
3. **Database Changes**: Use migration scripts in `migrations/`
4. **Offline Testing**: Use offline mode to test UI without backend
5. **Multiple Environments**: Use different script options for different setups

## 🆘 Getting Help

If you encounter issues:

1. Check the terminal output for error messages
2. Verify Docker is running (for backend)
3. Check if ports 3000/3001 are available
4. Use `npm run dev --help` for script options
5. Check logs in the respective terminal windows

## 🔄 Updates

When pulling new changes:

```bash
git pull
cd app && npm install  # If backend dependencies changed
cd ../frontend && npm install  # If frontend dependencies changed
npm run dev  # Restart development environment
```
