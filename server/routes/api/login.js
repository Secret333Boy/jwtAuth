require('isomorphic-unfetch');
const jwt = require('jsonwebtoken');
const { createHmac } = require('crypto');
const { createClient } = require('urql');
const client = createClient({
  url: process.env.hasuraURL,
  fetchOptions: {
    headers: {
      'x-hasura-admin-secret': process.env.hasuraSecret,
    },
  },
  requestPolicy: 'network-only',
});

const getUserDataByEmail = `
query getUserDataByEmail($email: String = "") {
  user(where: {email: {_eq: $email}}) {
    email
    password
    activated
    activationLink
  }
}`;

module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send('Logging in failed');
      return;
    }
    const hash = createHmac('sha256', process.env.passSecretToken)
      .update(password)
      .digest('hex');
    const { data, error } = await client
      .query(getUserDataByEmail, { email })
      .toPromise();
    if (error) {
      throw error;
    }
    const userData = data.user[0];
    if (!userData || userData.email !== email || userData.password !== hash) {
      res.status(401);
      res.statusMessage = 'Credentials are not valid!';
      res.send();
      return;
    }
    const accessToken = jwt.sign(
      { email, hash },
      process.env.secretAccessJWTKey,
      {
        expiresIn: '30m',
      }
    );
    const refreshToken = jwt.sign(
      { email, hash },
      process.env.secretRefreshJWTKey,
      { expiresIn: '14d' }
    );
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; Expires=${new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toUTCString()}; httpOnly=true; Secure`
    );
    res.status(200).json(accessToken);
  } catch (e) {
    console.error(e);
    res.status(401).json(e);
  }
};
