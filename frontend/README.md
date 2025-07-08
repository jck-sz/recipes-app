# FODMAP Frontend

This folder contains the frontend application for the FODMAP Recipe App. It includes both a working HTML/JavaScript implementation and an Angular version.

## 🚀 Quick Start

### Prerequisites
- Backend API running in Docker (see `../docker/README.md`)
- Node.js installed locally (for running static server)

### Running the Frontend

1. **Start the backend first**:
   ```bash
   cd ../docker
   npm run setup
   ```
   Wait for "🎉 FODMAP Docker environment is ready!" message.

2. **Start the frontend server**:
   ```bash
   cd ../frontend
   npx http-server -p 3001
   ```

3. **Access the application**:
   - **Working version**: http://localhost:3001/simple.html ✅
   - **Angular version**: http://localhost:3001 (has SystemJS issues) ⚠️
   - **API testing**: http://localhost:3001/test.html

## 📱 Frontend Versions

### simple.html (Recommended) ✅
- **Pure HTML/CSS/JavaScript** implementation
- **Fully functional** with all required features:
  - Displays all recipes from database
  - Shows ingredients with FODMAP levels (LOW/MODERATE/HIGH)
  - Button to switch between recipes and ingredients
  - Responsive design
  - Error handling for API failures

### Angular Version (index.html) ⚠️
- **SystemJS loading issues** prevent proper startup
- Contains Angular components but doesn't load correctly
- Use `simple.html` instead for reliable functionality

### test.html 🧪
- Simple API connectivity testing
- Useful for debugging backend communication
- Tests both `/recipes` and `/ingredients` endpoints

## 🔧 Configuration

### API Connection
The frontend connects to the backend API at `http://localhost:3000`. This is configured in:
- `simple.html`: `API_BASE_URL` constant
- `app/recipe.service.ts`: `API_BASE_URL` property (Angular version)

### CORS Setup
The backend is automatically configured to allow requests from `http://localhost:3001`.

## 🛠️ Development

### Making Changes
1. **simple.html**: Edit directly, refresh browser to see changes
2. **Angular files**: Modify TypeScript files in `app/` directory
3. **Styling**: Update CSS in the respective files

### File Structure
```
frontend/
├── simple.html          # Working HTML/JS frontend (recommended)
├── test.html           # API testing interface
├── index.html          # Angular entry point (has issues)
├── app/                # Angular application files
│   ├── main.ts         # Bootstrap file
│   ├── app.module.ts   # Main module
│   ├── app.component.ts # Root component
│   ├── recipes.component.ts # Recipes display
│   ├── ingredients.component.ts # Ingredients display
│   ├── recipe.service.ts # API service
│   └── ingredient.service.ts # Ingredient service
├── systemjs.config.js  # SystemJS configuration
└── tsconfig.json       # TypeScript configuration
```

## 🧪 Testing

### Frontend Testing
```bash
# Test API connectivity
curl http://localhost:3000/health

# Test CORS from frontend origin
curl -H "Origin: http://localhost:3001" http://localhost:3000/recipes
```

### Browser Testing
1. Open browser developer tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed API requests
4. Verify CORS headers in response

## 🚨 Troubleshooting

### Common Issues

1. **"Failed to fetch" errors**:
   - Ensure backend is running: `curl http://localhost:3000/health`
   - Check frontend is on port 3001
   - Verify CORS configuration in backend

2. **Angular version not loading**:
   - Use `simple.html` instead
   - SystemJS has compatibility issues with current Angular setup

3. **Empty data display**:
   - Recipes table starts empty (expected)
   - Ingredients should show sample data
   - Check browser console for API errors

4. **Port conflicts**:
   - Frontend must run on port 3001 for CORS to work
   - Backend runs on port 3000
   - Change ports in both frontend and backend CORS config if needed

### Debug Steps
1. Check if backend is accessible: `http://localhost:3000/health`
2. Test API endpoints: `http://localhost:3000/recipes`
3. Verify frontend server: `http://localhost:3001/test.html`
4. Check browser console for errors

## 🎯 Future Improvements

1. **Fix Angular SystemJS issues** for full Angular functionality
2. **Add recipe creation forms** for adding new recipes
3. **Implement recipe editing** capabilities
4. **Add ingredient management** UI
5. **Improve responsive design** for mobile devices
6. **Add loading states** and better error handling

## 📝 API Integration

The frontend communicates with these backend endpoints:
- `GET /health` - Health check
- `GET /recipes` - List all recipes
- `GET /ingredients` - List all ingredients with FODMAP levels
- `GET /categories` - List recipe categories
- `GET /tags` - List recipe tags

For complete API documentation, see `../app/API_DOCUMENTATION.md`.
