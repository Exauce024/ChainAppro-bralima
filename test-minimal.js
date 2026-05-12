const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!');
});

const PORT = 4000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur minimal démarré sur http://localhost:${PORT}`);
  console.log(`Adresse: 0.0.0.0:${PORT}`);
});
