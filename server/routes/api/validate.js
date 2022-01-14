require('isomorphic-unfetch');
const jwt = require('jsonwebtoken');
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
    const token = req.headers.auth;
    if (!token) {
      res.status(401).json(false);
      return;
    }
    const tokenData = jwt.verify(token, process.env.secretAccessJWTKey);
    const { data, error } = await client
      .query(getUserDataByEmail, { email: tokenData.email })
      .toPromise();
    const userData = data.user[0];
    if (!userData || error) {
      res.status(401);
      res.statusMessage = 'User data was not found';
      res.send();
      return;
    }
    if (!userData.activated) {
      res.status(401);
      res.statusMessage = 'You need to activate your account (sent via email)';
      res.send();
      return;
    }
    res.status(200).json(true);
  } catch (e) {
    res.status(401).json(false);
  }
};
