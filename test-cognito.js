const https = require('https');

const options = {
  hostname: 'ap-southeast-1ehvuifdqo.auth.ap-southeast-1.amazoncognito.com',
  port: 443,
  path: '/oauth2/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  }
};

const req = https.request(options, (res) => {
  console.log(`statusCode: ${res.statusCode}`);
  res.on('data', (d) => {
    process.stdout.write(d);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write('grant_type=client_credentials&client_id=5jm9iubsbs5pqndt4js4d86lc4');
req.end();
