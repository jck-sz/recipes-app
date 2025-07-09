#!/usr/bin/env node

/**
 * Health Check Script for FODMAP Recipe Application
 * Verifies that all services are running correctly
 */

const http = require('http');

const services = [
  { name: 'Backend API', url: 'http://localhost:3000/health', timeout: 5000 },
  { name: 'Frontend', url: 'http://localhost:3001', timeout: 5000 }
];

function checkService(service) {
  return new Promise((resolve) => {
    const req = http.get(service.url, { timeout: service.timeout }, (res) => {
      resolve({
        name: service.name,
        status: res.statusCode === 200 ? 'OK' : `HTTP ${res.statusCode}`,
        healthy: res.statusCode === 200
      });
    });

    req.on('error', (error) => {
      resolve({
        name: service.name,
        status: `ERROR: ${error.message}`,
        healthy: false
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        name: service.name,
        status: 'TIMEOUT',
        healthy: false
      });
    });
  });
}

async function runHealthCheck() {
  console.log('🏥 FODMAP Application Health Check');
  console.log('==================================');
  console.log('');

  const results = await Promise.all(services.map(checkService));
  
  let allHealthy = true;
  
  results.forEach(result => {
    const icon = result.healthy ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (!result.healthy) allHealthy = false;
  });

  console.log('');
  
  if (allHealthy) {
    console.log('🎉 All services are healthy!');
    console.log('');
    console.log('📱 Access the application:');
    console.log('   Frontend: http://localhost:3001');
    console.log('   Admin Panel: http://localhost:3001/admin.html');
    console.log('   API Health: http://localhost:3000/health');
    console.log('');
    console.log('🔑 Admin Password: Dupadupa123');
    process.exit(0);
  } else {
    console.log('⚠️ Some services are not healthy');
    console.log('');
    console.log('💡 Troubleshooting:');
    console.log('   1. Make sure Docker is running');
    console.log('   2. Run: npm run setup');
    console.log('   3. Wait a few moments for services to start');
    console.log('   4. Run this health check again');
    process.exit(1);
  }
}

if (require.main === module) {
  runHealthCheck().catch(console.error);
}

module.exports = { runHealthCheck, checkService };
