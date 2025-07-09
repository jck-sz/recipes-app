#!/bin/bash

# FODMAP Development Environment Startup Script
# This script starts both the backend and frontend services for development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Default options
SKIP_DOCKER=false
FRONTEND_ONLY=false
BACKEND_ONLY=false
SHOW_HELP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-docker)
            SKIP_DOCKER=true
            shift
            ;;
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        --help|-h)
            SHOW_HELP=true
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            SHOW_HELP=true
            shift
            ;;
    esac
done

show_help() {
    echo -e "${CYAN}FODMAP Development Environment Startup Script${NC}"
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./start-dev.sh                    # Start both backend and frontend"
    echo "  ./start-dev.sh --skip-docker      # Start without Docker (requires manual DB setup)"
    echo "  ./start-dev.sh --frontend-only    # Start only the frontend server"
    echo "  ./start-dev.sh --backend-only     # Start only the backend API"
    echo "  ./start-dev.sh --help             # Show this help message"
    echo ""
    echo -e "${YELLOW}Services:${NC}"
    echo "  Backend API:  http://localhost:3000"
    echo "  Frontend:     http://localhost:3001"
    echo "  Admin Panel:  http://localhost:3001/admin.html"
    echo ""
    echo -e "${YELLOW}Admin Credentials:${NC}"
    echo "  Password: Dupadupa123"
    echo ""
}

test_docker_running() {
    if command -v docker &> /dev/null && docker version &> /dev/null; then
        return 0
    else
        return 1
    fi
}

test_port() {
    local port=$1
    if command -v nc &> /dev/null; then
        nc -z localhost $port 2>/dev/null
    elif command -v telnet &> /dev/null; then
        timeout 1 telnet localhost $port &> /dev/null
    else
        # Fallback using /dev/tcp
        timeout 1 bash -c "echo >/dev/tcp/localhost/$port" 2>/dev/null
    fi
}

start_backend_service() {
    echo -e "${GREEN}🚀 Starting Backend Service...${NC}"
    
    if [ "$SKIP_DOCKER" = false ]; then
        # Check if Docker is running
        if ! test_docker_running; then
            echo -e "${RED}❌ Docker is not running!${NC}"
            echo -e "${YELLOW}💡 Please start Docker and try again, or use --skip-docker flag${NC}"
            return 1
        fi
        
        # Start Docker services
        echo -e "${CYAN}🐳 Starting Docker services...${NC}"
        cd docker
        if ! npm run setup; then
            echo -e "${RED}❌ Failed to start Docker services${NC}"
            cd ..
            return 1
        fi
        cd ..
        
        # Wait for backend to be ready
        echo -e "${YELLOW}⏳ Waiting for backend to be ready...${NC}"
        timeout=60
        elapsed=0
        while [ $elapsed -lt $timeout ]; do
            if test_port 3000; then
                echo -e "${GREEN}✅ Backend is ready!${NC}"
                return 0
            fi
            sleep 2
            elapsed=$((elapsed + 2))
            echo -n "."
        done
        echo ""
        echo -e "${YELLOW}⚠️ Backend took longer than expected to start${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️ Skipping Docker - make sure database is running manually${NC}"
        
        # Start backend directly
        cd app
        echo -e "${CYAN}🔧 Starting backend API...${NC}"
        gnome-terminal -- bash -c "npm start; exec bash" 2>/dev/null || \
        xterm -e "npm start; bash" 2>/dev/null || \
        npm start &
        cd ..
        sleep 3
        return 0
    fi
}

start_frontend_service() {
    echo -e "${GREEN}🌐 Starting Frontend Service...${NC}"
    
    # Check if http-server is installed
    if ! command -v npx &> /dev/null || ! npx http-server --version &> /dev/null; then
        echo -e "${YELLOW}📦 Installing http-server...${NC}"
        npm install -g http-server
    fi
    
    # Start frontend server
    cd frontend
    echo -e "${CYAN}🔧 Starting frontend server...${NC}"
    gnome-terminal -- bash -c "npx http-server -p 3001; exec bash" 2>/dev/null || \
    xterm -e "npx http-server -p 3001; bash" 2>/dev/null || \
    npx http-server -p 3001 &
    cd ..
    sleep 2
    
    # Wait for frontend to be ready
    timeout=30
    elapsed=0
    while [ $elapsed -lt $timeout ]; do
        if test_port 3001; then
            echo -e "${GREEN}✅ Frontend is ready!${NC}"
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    echo -e "${YELLOW}⚠️ Frontend took longer than expected to start${NC}"
    return 0
}

show_service_status() {
    echo ""
    echo -e "${CYAN}📊 Service Status:${NC}"
    echo -e "${CYAN}==================${NC}"
    
    if test_port 3000; then
        echo -e "${GREEN}✅ Backend API:  http://localhost:3000${NC}"
    else
        echo -e "${RED}❌ Backend API:  Not running${NC}"
    fi
    
    if test_port 3001; then
        echo -e "${GREEN}✅ Frontend:     http://localhost:3001${NC}"
        echo -e "${GREEN}✅ Admin Panel:  http://localhost:3001/admin.html${NC}"
    else
        echo -e "${RED}❌ Frontend:     Not running${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}🔑 Admin Password: Dupadupa123${NC}"
    echo ""
}

# Main execution
if [ "$SHOW_HELP" = true ]; then
    show_help
    exit 0
fi

echo -e "${MAGENTA}🍽️ FODMAP Development Environment${NC}"
echo -e "${MAGENTA}=================================${NC}"
echo ""

backend_started=false
frontend_started=false

if [ "$FRONTEND_ONLY" = false ]; then
    if start_backend_service; then
        backend_started=true
    fi
fi

if [ "$BACKEND_ONLY" = false ]; then
    if start_frontend_service; then
        frontend_started=true
    fi
fi

show_service_status

if [ "$backend_started" = true ] || [ "$frontend_started" = true ]; then
    echo -e "${GREEN}🎉 Development environment is ready!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Tips:${NC}"
    echo "  - Use Ctrl+C in the terminal windows to stop services"
    echo "  - Frontend changes are reflected immediately"
    echo "  - Backend changes require restart"
    echo "  - Check logs in the respective terminal windows"
    echo ""
    
    if [ "$frontend_started" = true ]; then
        echo -e "${CYAN}🌐 Opening admin panel...${NC}"
        sleep 2
        if command -v xdg-open &> /dev/null; then
            xdg-open "http://localhost:3001/admin.html" &> /dev/null &
        elif command -v open &> /dev/null; then
            open "http://localhost:3001/admin.html" &> /dev/null &
        fi
    fi
else
    echo -e "${RED}❌ Failed to start development environment${NC}"
    echo -e "${YELLOW}💡 Check the error messages above and try again${NC}"
    exit 1
fi
