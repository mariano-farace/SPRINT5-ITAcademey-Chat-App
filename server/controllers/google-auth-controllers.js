const { google } = require('googleapis');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createJWT, setCookie } = require('../helpers/helper');

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  SERVER_ROOT_URI,
  CLIENT_REDIRECT_TO_URI,
  JWT_SECRET,
  COOKIE_NAME,
  REDIRECT_URL,
} = require('../config');
/**
 * Create the google auth object which gives us access to talk to google's apis.
 * Will connect to Google when we want it to
 */
// TODO crear funcion y llamarla en el lugar que se necesita
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${SERVER_ROOT_URI}/${REDIRECT_URL}`
  ,
);

/**
Function to get the auth URL. Esta es la url que el usuario hace click para loguearse!
 */

function getGoogleAuthURL(req, res) {
  /*
  * Generate a url that asks permissions to the user's email and profile
  *
  *When the user clicks the link generated by the function getGoogleAuthURL, they will
  *give permission to your application and be redirected to the URL that you
  *specified as the 3rd argument in oauth2Client.
   */
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const googleAuthURL = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes, // If you only need one scope you can pass it as string
  });

  res.json(googleAuthURL);
}

/*
Function that fetches the bearer token with the code, then fetches the user’s profile
*/
async function getGoogleUser({ code }) {
  const { tokens } = await oauth2Client.getToken(code);
  // Fetch the user's profile with the access token and bearer
  const googleUser = await axios
    .get(
      `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.id_token}`,
        },
      },
    )
    .then((res) => res.data)
    .catch((error) => {
      throw new Error(error.message);
    });

  return googleUser;
}

async function googleAuthCheckDbSendJWT(req, res) {
  console.log('[1;35m pasa por googleAuthCheckDbSendJWT');

  const { code } = req.query;
  const googleUser = await getGoogleUser({ code });
  try {
    let user = await User.findOne({ email: googleUser.email });
    if (!user) {
      user = await User.create({ name: googleUser.name, email: googleUser.email, password: 'isOauth: true' });
    }

    const token = createJWT(user._id);

    console.log('[1;35m y este es el token:', token);

    setCookie(token, res);
    res.redirect(CLIENT_REDIRECT_TO_URI);
  } catch (error) {
    console.log(error);
    res.status(400).json(error);
  }
}

async function verifyGoogleAuthToken(req, res) {
  try {
    console.log('[1;31m entra a verifyGoogleAuthToken');
    console.log('[1;31m req.cookies[COOKIE_NAME]', req.cookies[COOKIE_NAME]);
    console.log('[1;31m req.cookies', req.cookies);

    const decodedToken = jwt.verify(req.cookies[COOKIE_NAME], JWT_SECRET);
    const userId = decodedToken.id;
    const user = await User.findById(userId);
    res.status(201).json({ user: { name: user.name, _id: user._id } });
  } catch (err) {
    console.log(err);
    console.log('salta el catch :error en verifyGoogleAuthToken');
    res.status(500).json({ error: 'Login failed' });
  }
}

module.exports = {
  getGoogleAuthURL, getGoogleUser, googleAuthCheckDbSendJWT, verifyGoogleAuthToken,
};
