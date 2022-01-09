require('isomorphic-unfetch');
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
const activateByLink = `
mutation activateByLink($activationLink: String = "") {
  update_user(where: {activationLink: {_eq: $activationLink}}, _set: {activated: true, activationLink: ""}) {
    affected_rows
  }
}`;
module.exports = async (req, res) => {
  try {
    await client
      .mutation(activateByLink, { activationLink: req.query.l })
      .toPromise();
    res.redirect('/');
  } catch (e) {
    res.status(500).send('Server error');
    console.error(e);
  }
};
