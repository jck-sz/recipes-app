#!/usr/bin/env node

const http = require('http');

const testRecipe = {
  title: "Test Recipe",
  description: "A test recipe for verification",
  preparation_time: 15,
  serving_size: 2,
  category_id: 1
};

const postData = JSON.stringify(testRecipe);

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/recipes',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(postData);
req.end();
