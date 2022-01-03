const jwt = require('jsonwebtoken');
module.exports = (req, res) => {
  try {
    const token = req.headers.auth;
    if (!token) {
      res.status(401).send('Unauthorized');
      return;
    }
    const tokenData = jwt.verify(token, process.env.secretAccessJWTKey);
    res.status(200).json({ data: 'Secret data' });
  } catch (e) {
    res.status(500).json(e);
    console.error(e);
  }
};
