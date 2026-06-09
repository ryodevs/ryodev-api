const express = require('express');
const app = express();
const bratController = require('../controllers/bratController');

// Middleware untuk JSON
app.use(express.json());

// Route Dasar
app.get('/', (req, res) => {
  res.json({ status: "online", creator: "RyodevAPI" });
});

// Route Brat
app.get('/api/brat', bratController.handleBrat);

module.exports = app;
