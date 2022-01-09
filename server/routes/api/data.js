const jwt = require('jsonwebtoken');
module.exports = (req, res) => {
  try {
    const token = req.headers.auth;
    if (!token) {
      res.status(401).send('Unauthorized :(');
      return;
    }
    const { email } = jwt.verify(token, process.env.secretAccessJWTKey);
    res.status(200).json({ data: `Secret data for ${email}` });
  } catch (e) {
    res.status(500).json(e);
    console.error(e);
  }
};
