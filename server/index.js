const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const app = express();
const router = require('./routes/router.js');
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(cors());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.resolve(__dirname, '../client/build')));
app.use(router);

app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

app.get('*', (req, res) => {
  res.status(404).send();
});

app.listen(port, () => {
  console.log(`Server has been started on port ${port}`);
});
