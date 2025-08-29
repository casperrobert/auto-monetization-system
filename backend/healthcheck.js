const http = require('http');

const req = http.request({
  hostname: '127.0.0.1',
  port: 3000,
  path: '/health',
  method: 'GET',
  timeout: 2000
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      process.exit(health.status === 'healthy' ? 0 : 1);
    } catch {
      process.exit(1);
    }
  });
});

req.on('error', () => process.exit(1));
req.on('timeout', () => process.exit(1));
req.end();