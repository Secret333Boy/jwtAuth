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
const getUserDataByEmail = `query getUserDataByEmail($email: String = "") {
  user(where: {email: {_eq: $email}}) {
    email
    password
    activated
    activationLink
  }
}
`;
module.exports = async (req, res) => {
  try {
    const token = req.headers.auth;
    if (!token) {
      res.status(401).send('Unauthorized :(');
      return;
    }
    const { email, hash } = jwt.verify(token, process.env.secretAccessJWTKey);
    const { data, error } = await client
      .query(getUserDataByEmail, { email })
      .toPromise();
    if (
      !data ||
      error ||
      data.user[0].password !== hash ||
      !data.user[0].activated
    ) {
      res.redirect('/api/logout');
      return;
    }
    res.status(200).json({ data: `Secret data for ${email}` });
  } catch (e) {
    res.status(500).json({ error: e });
    console.error(e);
  }
};
