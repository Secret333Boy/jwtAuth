module.exports = (req, res) => {
  res.setHeader(
    'Set-Cookie',
    `refreshToken=; Expires=${new Date(
      Date.now()
    ).toUTCString()}; httpOnly=true; Secure`
  );
  res.redirect('/');
};
