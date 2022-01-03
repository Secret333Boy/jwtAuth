module.exports = (req, res) => {
  try {
    const token = req.headers.auth;
    if (!token) {
      res.status(401).send('Unauthorized');
      return;
    }
    res.status(200).json({ data: 'Secret data' });
  } catch (e) {
    res.status(500).json(e);
    console.error(e);
  }
};
