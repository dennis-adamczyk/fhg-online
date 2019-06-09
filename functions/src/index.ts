import * as admin from 'firebase-admin';
var serviceAccount = require(__dirname +
  '/fhg-online-firebase-adminsdk-7nhoc-4bc4510394.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://fhg-online.firebaseio.com'
});

import * as rendering from './ssr';
import * as login from './login';
import * as settings from './settings';

export const ssr = rendering.ssr;
export const registerUser = login.registerUser;
export const changeSettings = settings.changeSettings;
