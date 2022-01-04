require('isomorphic-unfetch');
const jwt = require('jsonwebtoken');
const { createHmac, randomUUID } = require('crypto');
const { createClient } = require('urql');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const client = createClient({
  url: process.env.hasuraURL,
  fetchOptions: {
    headers: {
      'x-hasura-admin-secret': process.env.hasuraSecret,
    },
  },
});

const clientId = process.env.clientID;
const clientSecret = process.env.clientSecret;
const redirectURI = process.env.redirectURI;
const refreshToken = process.env.refreshToken;
const oAuth2Client = new google.auth.OAuth2(
  clientId,
  clientSecret,
  redirectURI
);
// eslint-disable-next-line camelcase
oAuth2Client.setCredentials({ refresh_token: refreshToken });
let accessToken = null;
let transporter = null;
const renewTransporter = async () => {
  try {
    accessToken = await oAuth2Client.getAccessToken();
    transporter = nodemailer.createTransport({
      service: 'gmail',
      secure: true,
      auth: {
        type: 'OAuth2',
        user: process.env.GMAIL,
        clientId,
        clientSecret,
        refreshToken,
        accessToken,
      },
    });
  } catch (e) {
    console.error(e);
  }
};
setInterval(renewTransporter, 4000 * 1000);

const setNewUser = `
mutation setNewUser($email: String = "", $password: String = "", $activationLink: String = "") {
  insert_user(objects: {email: $email, password: $password, activationLink: $activationLink}) {
    affected_rows
  }
}
`;
const setNewToken = `
mutation setNewToken($email: String = "", $token: String = "") {
  insert_token(objects: {email: $email, token: $token}) {
    affected_rows
  }
}
`;
module.exports = async (req, res) => {
  try {
    const { email, password } = JSON.parse(req.body);
    if (!email || !password) {
      res.status(400).send('Registration failed');
      return;
    }
    const hash = createHmac('sha256', process.env.passSecretToken)
      .update(password)
      .digest('hex');
    const accessToken = jwt.sign(
      { email, hash },
      process.env.secretAccessJWTKey,
      { expiresIn: '30m' }
    );
    const refreshToken = jwt.sign(
      { email, hash },
      process.env.secretRefreshJWTKey,
      { expiresIn: '14d' }
    );
    const activationLink = randomUUID();
    await client
      .mutation(setNewUser, { email, password: hash, activationLink })
      .toPromise();

    await client
      .mutation(setNewToken, { email, token: refreshToken })
      .toPromise();
    await renewTransporter();
    await transporter.sendMail({
      from: `"Unknown company" <${process.env.GMAIL}>`,
      to: email,
      subject: 'Account activation',
      html: `<b>To activate your account, use this link:</b><br><a href="${process.env.VERCEL_URL}/api/activate?l=${activationLink}">activate</a>`,
    });
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; Expires=${new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toUTCString()}; httpOnly=true; Secure`
    );
    res.status(200).json(accessToken);
  } catch (e) {
    console.error(e);
    res.status(500).json(e);
  }
};
