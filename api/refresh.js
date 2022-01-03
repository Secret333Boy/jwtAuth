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
});
const getTokenByEmail = `
query getTokenByEmail($email: String = "") {
  token(where: {email: {_eq: $email}}) {
    token
  }
}`;
const getUserDataByEmail = `
query getUserDataByEmail($email: String = "") {
  user(where: {email: {_eq: $email}}) {
    email
    password
    activated
    activationLink
  }
}`;
const setTokenByEmail = `
mutation setTokenByEmail($token: String = "", $email: String = "") {
  update_token(where: {email: {_eq: $email}}, _set: {token: $token}) {
    affected_rows
  }
}
`;

const getNewTokens = async (email) => {
  const { data } = await client
    .query(getUserDataByEmail, { email })
    .toPromise();
  const hash = data.user[0].password;
  console.log(hash);
  const newAccessToken = jwt.sign(
    { email, hash },
    process.env.secretAccessJWTKey,
    { expiresIn: '30m' }
  );
  const newRefreshToken = jwt.sign(
    { email, hash },
    process.env.secretRefreshJWTKey,
    { expiresIn: '14d' }
  );
  return { newAccessToken, newRefreshToken };
};
module.exports = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const tokenData = jwt.verify(refreshToken, process.env.secretRefreshJWTKey);
    const { data, error } = await client
      .query(getTokenByEmail, {
        email: tokenData.email,
      })
      .toPromise();
    const tokenInDB = data.token[0]?.token;
    if (refreshToken !== tokenInDB || error) {
      throw new Error('Token is not valid');
    }

    const { newAccessToken, newRefreshToken } = await getNewTokens(
      tokenData.email
    );
    await client
      .mutation(setTokenByEmail, {
        email: tokenData.email,
        token: newRefreshToken,
      })
      .toPromise();
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${newRefreshToken}; Expires=${new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toUTCString()}; httpOnly=true; Secure`
    );
    res.status(200).json(newAccessToken);
  } catch (e) {
    console.error(e);
    res.status(500).json();
  }
};
