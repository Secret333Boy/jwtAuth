const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const router = require('./routes/router.js');
require('dotenv').config();
const port = process.env.PORT || 3000;

app.use(cors());
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
