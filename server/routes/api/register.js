require('dotenv').config();
require('isomorphic-unfetch');
const jwt = require('jsonwebtoken');
const { createHmac, randomUUID } = require('crypto');
const { createClient } = require('urql');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const computationalEffort = require('./computationalEffort');
const client = createClient({
  url: process.env.hasuraURL,
  fetchOptions: {
    headers: {
      'x-hasura-admin-secret': process.env.hasuraSecret,
    },
  },
  requestPolicy: 'network-only',
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

const getUserDataByEmail = `
query getUserDataByEmail($email: String = "") {
  user(where: {email: {_eq: $email}}) {
    email
    password
    activated
    activationLink
  }
}`;
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

const emailRegExp = new RegExp(
  '^((([0-9A-Za-z]{1}[-0-9A-z.]{0,30}[0-9A-Za-z]?)|([0-9А-Яа-я]{1}[-0-9А-я.]{0,30}[0-9А-Яа-я]?))@([-A-Za-z]{1,}.){1,}[-A-Za-z]{2,})$'
);
module.exports = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password || !email.match(emailRegExp)) {
      res.status(400);
      res.statusMessage = 'Registration failed because of bad data';
      res.send();
      return;
    }
    const { data } = await client
      .query(getUserDataByEmail, { email })
      .toPromise();
    if (data.user[0]) {
      res.status(401);
      res.statusMessage = 'User already exists';
      res.send();
      return;
    }
    const hash = await computationalEffort(
      () =>
        createHmac('sha256', process.env.passSecretToken)
          .update(password)
          .digest('hex'),
      1000
    );
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
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; Expires=${new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000
      ).toUTCString()}; httpOnly; Secure; path="/api"`
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
      html: `<b>To activate your account, use this link:</b><br><a href="${process.env.activationEndpoint}?l=${activationLink}">activate</a>`,
    });
    res.status(200).json(accessToken);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e });
  }
};
