# Environment Setup Guide

This guide explains how to configure the environment variables for the FODMAP Recipe API.

## Quick Start

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file with your specific configuration values.

3. Start the application:
   ```bash
   npm start
   ```

The application will validate all environment variables on startup and display any errors or warnings.

## Required Environment Variables

### Database Configuration

- **DATABASE_URL** (required): PostgreSQL connection string
  ```
  DATABASE_URL=postgresql://username:password@localhost:5432/fodmap_recipes
  ```

## Optional Environment Variables

### Application Settings

- **NODE_ENV**: Application environment (`development`, `production`, `test`)
  - Default: `development`
- **PORT**: Server port number
  - Default: `3000`
- **APP_NAME**: Application name for monitoring
  - Default: `fodmap-recipe-api`

### Database Pool Settings

- **DB_POOL_MAX**: Maximum database connections (1-100)
  - Default: `20`
- **DB_POOL_MIN**: Minimum database connections (0-50)
  - Default: `2`
- **DB_IDLE_TIMEOUT**: Connection idle timeout in milliseconds
  - Default: `30000` (30 seconds)
- **DB_CONNECTION_TIMEOUT**: Connection timeout in milliseconds
  - Default: `10000` (10 seconds)

### Security Settings

- **ALLOWED_ORIGINS**: CORS allowed origins (comma-separated)
  - Default: `*` (allow all origins)
  - Production example: `https://myapp.com,https://api.myapp.com`

### Rate Limiting

- **RATE_LIMIT_WINDOW_MS**: General rate limit window in milliseconds
  - Default: `900000` (15 minutes)
- **RATE_LIMIT_MAX_REQUESTS**: Max requests per window
  - Default: `100`
- **STRICT_RATE_LIMIT_WINDOW_MS**: Write operations rate limit window
  - Default: `900000` (15 minutes)
- **STRICT_RATE_LIMIT_MAX_REQUESTS**: Max write requests per window
  - Default: `20`
- **BULK_RATE_LIMIT_WINDOW_MS**: Bulk operations rate limit window
  - Default: `3600000` (1 hour)
- **BULK_RATE_LIMIT_MAX_REQUESTS**: Max bulk requests per window
  - Default: `5`
- **SEARCH_RATE_LIMIT_WINDOW_MS**: Search operations rate limit window
  - Default: `300000` (5 minutes)
- **SEARCH_RATE_LIMIT_MAX_REQUESTS**: Max search requests per window
  - Default: `50`

### Logging

- **LOG_LEVEL**: Logging level (`error`, `warn`, `info`, `debug`)
  - Default: `info`
- **ENABLE_REQUEST_LOGGING**: Enable request logging
  - Default: `true`

## Environment Validation

The application automatically validates all environment variables on startup:

- **Required variables**: Must be present and valid
- **Type checking**: Ensures correct data types (string, number, boolean, etc.)
- **Range validation**: Checks that numbers are within acceptable ranges
- **Format validation**: Validates URLs, connection strings, etc.
- **Custom validation**: Applies business logic validation rules

### Validation Errors

If validation fails, the application will:
1. Display detailed error messages
2. Exit with code 1
3. Provide guidance on fixing the issues

### Validation Warnings

The application may show warnings for:
- Using default values in production
- Potentially insecure configurations
- Performance-related settings

## Production Considerations

### Security

1. **Never use default values in production**
2. **Use strong, unique passwords and secrets**
3. **Regularly rotate credentials**
4. **Use HTTPS in production**
5. **Restrict CORS origins to your domains**

### Performance

1. **Tune database pool settings** based on your load
2. **Adjust rate limits** based on your usage patterns
3. **Monitor connection usage** and adjust accordingly

### Monitoring

1. **Set appropriate log levels** (usually `warn` or `error` in production)
2. **Use structured logging** for better analysis
3. **Monitor environment variable changes**

## Example Configurations

### Development Environment
```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/fodmap_dev
LOG_LEVEL=debug
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Production Environment
```bash
NODE_ENV=production
PORT=8080
DATABASE_URL=postgresql://prod_user:secure_password@db.example.com:5432/fodmap_prod
LOG_LEVEL=warn
ALLOWED_ORIGINS=https://myapp.com,https://api.myapp.com
DB_POOL_MAX=50
RATE_LIMIT_MAX_REQUESTS=1000
```

### Testing Environment
```bash
NODE_ENV=test
PORT=3001
DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/fodmap_test
LOG_LEVEL=error
ENABLE_REQUEST_LOGGING=false
```

## Troubleshooting

### Common Issues

1. **Database connection fails**
   - Check DATABASE_URL format
   - Verify database server is running
   - Confirm credentials are correct

2. **Port already in use**
   - Change PORT to an available port
   - Check for other running applications

3. **Rate limiting too strict**
   - Adjust rate limit settings for your use case
   - Consider different limits for different environments

4. **CORS errors**
   - Add your frontend domain to ALLOWED_ORIGINS
   - Use `*` only for development

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your `.env` file against `.env.example`
3. Ensure all required variables are set
4. Check the application logs for more details
