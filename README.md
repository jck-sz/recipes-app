# FODMAP Recipe Application

A full-stack web application for managing recipes and ingredients with FODMAP (Fermentable Oligosaccharides, Disaccharides, Monosaccharides, and Polyols) level tracking.

## 🚀 Quick Start

**Prerequisites:** Docker Desktop must be running

```bash
# Clone and start the application
git clone <repository>
cd fodmap
npm start
```

That's it! The application will:
1. ✅ Start the database automatically
2. ⏳ Wait for it to be ready
3. 🚀 Start the backend API
4. 🌐 Start the frontend
5. 🔗 Open the admin panel in your browser

## 📱 Access the Application

- **Frontend (SystemJS)**: http://localhost:3001
- **Frontend (Angular)**: http://localhost:3002
- **Admin Panel**: http://localhost:3001/admin.html
- **API Health**: http://localhost:3000/health
- **Admin Password**: `Dupadupa123`

## 🔧 Alternative Commands

```bash
npm run setup     # Setup database only
npm run backend   # Start backend only
npm run frontend  # Start frontend only
npm run health    # Check service health
```

## 🚀 New Computer Setup

### Prerequisites
- **Docker & Docker Compose** (required for backend)
- **Node.js** (required for frontend)
- **Git** (for cloning the repository)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fodmap
```

### 2. Start Backend (Docker)
```bash
cd docker
npm run setup
```

This will:
- Generate secure random passwords
- Create environment configuration
- Start PostgreSQL database and Node.js API in Docker
- Initialize database schema and seed data
- Create database user with proper permissions

**Wait for the setup to complete** - you'll see "🎉 FODMAP Docker environment is ready!" when done.

### 3. Start Frontend
```bash
cd ../frontend
npx http-server -p 3001
```

### 4. Access the Application
- **Frontend**: http://localhost:3001
- **Admin Panel**: http://localhost:3001/admin.html (Password: `Dupadupa123`)
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 📱 Application Features

### Frontend Functionality
- **Recipe Display by Category**: Recipes organized by meal type (Śniadanie, Obiad, Kolacja, Przekąska)
- **Complete Recipe Information**: Title, description, prep time, serving size, and full ingredient lists
- **Rich Text Display**: Recipe descriptions support HTML formatting (bold, italic, lists, paragraphs)
- **Ingredient Details**: Each recipe shows ingredients with quantities, units, and FODMAP levels
- **FODMAP Level Indicators**: Color-coded badges (LOW=green, MODERATE=yellow, HIGH=red)
- **Ingredient Browser**: Grid view of all ingredients with FODMAP levels and units
- **Modern UI Design**: Gradient backgrounds, glassmorphism effects, and smooth animations
- **Admin Panel**: Enhanced password-protected interface for recipe and ingredient management
- **Responsive Design**: Mobile-first design that works perfectly on all devices

### Backend API
- **Complete CRUD operations** for recipes, ingredients, categories, and tags
- **FODMAP level tracking** for ingredients
- **Search and filtering** capabilities
- **Pagination** support
- **Health monitoring** endpoint
- **CORS enabled** for frontend communication

## 🛠️ Development Workflow

### Backend Development (Docker)
```bash
cd docker

# View logs in real-time
npm run logs

# Restart services
npm run restart

# Stop services
npm run stop

# Access API container shell
npm run shell:api

# Access database shell
npm run shell:db
```

### Frontend Development
The frontend uses a simple HTML/JavaScript approach for maximum compatibility:
- **Main app**: `frontend/index.html` (recommended)
- **Admin panel**: `frontend/admin.html` (password-protected recipe management)
- **Angular CLI version**: `frontend/angular-app/` (modern Angular implementation)
- **API testing**: `frontend/test.html`

### Admin Panel Features
The admin panel (`http://localhost:3001/admin.html`) provides:
- **Password Protection**: Secure access with configurable password
- **Recipe Management**: Add new recipes with ingredients and details
- **Rich Text Editor**: Full WYSIWYG editor for recipe descriptions with bold, italic, lists, and formatting
- **Ingredient Management**: Add new ingredients with FODMAP levels
- **Dynamic Ingredient Addition**: Create new ingredients while adding recipes
- **Data Overview**: View existing recipes and ingredients
- **Form Validation**: Comprehensive input validation and error handling

### Making Changes
1. **Backend changes**: Code is automatically reloaded in Docker container
2. **Frontend changes**: Refresh browser to see updates
3. **Database changes**: Modify files in `migrations/` directory

## 📁 Project Structure

```
fodmap/
├── app/                    # Backend Node.js application
│   ├── routes/            # API route handlers
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic
│   └── validation/        # Input validation
├── docker/                # Docker configuration
│   ├── docker-compose.yml
│   ├── setup.js          # Automated setup script
│   └── .env              # Environment variables (auto-generated)
├── frontend/              # Frontend application
│   ├── index.html        # Main HTML/JS frontend
│   ├── angular-app/      # Modern Angular CLI application
│   └── app/              # Legacy Angular components
├── migrations/            # Database schema and seed data
│   ├── init-complete.sql # Complete database setup
│   └── schema_enhancements.sql
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables (Auto-generated)
The setup script creates `docker/.env` with:
- Database credentials (random passwords)
- API configuration
- CORS settings
- Port configurations

### CORS Configuration
Frontend is configured to run on port 3001 and backend on port 3000. CORS is automatically configured to allow communication between them.

## 🧪 Testing

### API Testing
```bash
# Health check
curl http://localhost:3000/health

# Get recipes
curl http://localhost:3000/recipes

# Get ingredients
curl http://localhost:3000/ingredients
```

### Frontend Testing
- Open `http://localhost:3001/test.html` for API connectivity testing
- Use browser developer tools to check for JavaScript errors

## 📊 Database

### Schema
- **recipes**: Recipe information with FODMAP scores
- **ingredients**: Ingredients with FODMAP levels (LOW/MODERATE/HIGH)
- **categories**: Recipe categories
- **tags**: Recipe tags
- **recipe_ingredients**: Many-to-many relationship

### Sample Data
The database is initialized with sample ingredients and their FODMAP levels. Recipes table starts empty.

## 🆕 Angular Frontend

The application now includes a modern Angular frontend alongside the original SystemJS version.

### Features
- **Modern Angular 20**: Latest Angular with standalone components
- **Lazy Loading**: Components load on demand for better performance
- **Responsive Design**: Mobile-friendly interface
- **FODMAP Color Coding**: Visual indicators for ingredient safety levels
- **Category Grouping**: Recipes organized by meal categories
- **Admin Integration**: Direct access to admin panel

### Development Commands
```bash
# Development server (with hot reload)
cd frontend
npm run dev

# Build for production
cd frontend
npm run build

# Serve production build
cd frontend
npm run serve

# Build and serve (complete workflow)
cd frontend
npm start
```

### Architecture
- **Standalone Components**: Modern Angular approach without NgModules
- **Lazy Loading**: Routes load components on demand
- **Environment Configuration**: API URLs managed via environment files
- **HTTP Client**: Configured for API communication
- **Routing**: Client-side routing with Angular Router

### Migration Status
✅ **Completed**:
- Angular CLI project setup
- Component migration (Recipes, Ingredients)
- Service layer (Recipe, Ingredient, Category services)
- Routing configuration
- Styling and FODMAP features
- Production build setup

🔄 **Future Enhancements**:
- Recipe creation forms
- Ingredient management UI
- User authentication
- Advanced filtering and search

## 🚨 Troubleshooting

### Backend Issues
1. **Database connection errors**:
   - Ensure Docker is running
   - Run `cd docker && npm run setup` to recreate environment

2. **Port conflicts**:
   - Backend uses port 3000
   - Database uses port 5432
   - Change ports in `docker/docker-compose.yml` if needed

3. **CORS errors**:
   - Frontend must run on port 3001
   - Backend automatically allows this origin

### Frontend Issues
1. **"Failed to fetch" errors**:
   - Ensure backend is running (`curl http://localhost:3000/health`)
   - Check browser console for CORS errors
   - Verify frontend is running on port 3001

2. **Legacy Angular version not working**:
   - Use `index.html` instead of the legacy Angular components
   - For modern Angular, use the `frontend/angular-app/` directory

### Database Issues
1. **Authentication errors**:
   - Stop containers: `cd docker && docker-compose down -v`
   - Restart setup: `npm run setup`

2. **Data persistence**:
   - Data is stored in Docker volumes
   - Use `docker-compose down -v` to reset all data

## 🔄 Starting Fresh

To completely reset the environment:
```bash
cd docker
docker-compose down -v  # Removes all data
npm run setup           # Recreates everything
```

## 📝 API Documentation

Detailed API documentation is available in:
- `app/API_DOCUMENTATION.md` - Complete API reference
- `app/API_ENDPOINTS.md` - Endpoint specifications

## 🎯 Next Steps

1. **Add recipes**: Use the API to create sample recipes
2. **Implement authentication**: Add user management
3. **Fix Angular frontend**: Resolve SystemJS loading issues
4. **Add recipe creation UI**: Frontend forms for adding recipes
5. **Implement recipe-ingredient relationships**: Connect recipes to ingredients

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure Docker is running and has sufficient resources
4. Check that ports 3000, 3001, and 5432 are available