import * as admin from 'firebase-admin';
admin.initializeApp();

import * as rendering from './ssr';
import * as login from './login';

export const ssr = rendering.ssr;
export const registerUser = login.registerUser;
