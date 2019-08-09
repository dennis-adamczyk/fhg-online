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
import * as admin_users from './admin/users';
import * as timetable from './timetable';

export const ssr = rendering.ssr;
export const registerUser = login.registerUser;
export const onChangeUser = login.onChangeUser;
export const onDeleteUser = login.onDeleteUser;
export const onChangeSettings = settings.onChangeSettings;
export const getUsers = admin_users.getUsers;
export const deleteUser = admin_users.deleteUser;
export const deleteUsers = admin_users.deleteUsers;
export const onChangeCourse = timetable.onChangeCourse;
