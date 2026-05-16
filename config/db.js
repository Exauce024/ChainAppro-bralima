const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config();

/**
 * SSL Aiven / MySQL managé :
 *   - DB_SSL_CA : contenu PEM complet (ou une seule ligne avec \n littéraux)
 *   - DB_SSL_CA_B64 : même certificat encodé en base64 (pratique sur Render)
 *   - DB_SSL_CA_PATH : chemin vers ca.pem (dev local uniquement en général)
 */
function buildSslOptions() {
  if (process.env.DB_SSL_DISABLE === 'true') {
    return undefined;
  }

  let ca;
  if (process.env.DB_SSL_CA_PATH) {
    const resolved = path.resolve(process.env.DB_SSL_CA_PATH);
    ca = fs.readFileSync(resolved, 'utf8');
  } else if (process.env.DB_SSL_CA) {
    ca = String(process.env.DB_SSL_CA).replace(/\\n/g, '\n').trim();
  } else if (process.env.DB_SSL_CA_B64) {
    ca = Buffer.from(process.env.DB_SSL_CA_B64, 'base64').toString('utf8');
  } else {
    return undefined;
  }

  return {
    ca,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

const ssl = buildSslOptions();
const port = parseInt(process.env.DB_PORT || '3306', 10);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number.isFinite(port) ? port : 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '15', 10),
  queueLimit: 0,
  ...(ssl ? { ssl } : {}),
});

console.log(
  ssl
    ? '✅ Pool MySQL initialisé (SSL activé)'
    : '✅ Pool MySQL initialisé (sans SSL — dev / local)'
);

module.exports = pool;
