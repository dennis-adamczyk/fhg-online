const non_webpack_require = eval('require');
import * as functions from 'firebase-functions';
const cors = require('cors')({ origin: true });
const universal = non_webpack_require('../dist/server').app;
universal.use(cors);

export const ssr = functions.https.onRequest(universal);
