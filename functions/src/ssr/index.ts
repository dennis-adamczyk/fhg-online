const non_webpack_require = eval('require');
import * as functions from 'firebase-functions';
const universal = non_webpack_require('../dist/server').app;

export const ssr = functions.https.onRequest(universal);
