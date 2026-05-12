require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.get('/login', (req, res) => {
  res.render('login-simple', { error: null });
});

app.get('/', (req, res) => {
  res.redirect('/login');
});

const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Serveur simplifié démarré sur http://localhost:${PORT}`);
  console.log('Testez avec: curl http://localhost:8080/login');
});
