# Use Node.js 20 (standard image, not Alpine) to avoid Rollup issues
FROM node:20

# Install curl for health check
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for Angular CLI)
RUN npm ci

# Copy source code
COPY . .

# Set environment variables to force correct platform detection
ENV npm_config_target_platform=linux
ENV npm_config_target_arch=x64
ENV npm_config_target_libc=glibc

# Fix Rollup issue by removing node_modules and reinstalling
RUN rm -rf node_modules package-lock.json && npm install

# Force install the correct Rollup native module
RUN npm install @rollup/rollup-linux-x64-gnu --force

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Build the Angular application for production
RUN ng build --configuration production

# Install a simple HTTP server to serve the built files
RUN npm install -g http-server

# Expose port 3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001 || exit 1

# Start the HTTP server to serve the built Angular app
CMD ["http-server", "dist/angular-app/browser", "-p", "3001", "-a", "0.0.0.0"]
