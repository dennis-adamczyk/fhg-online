import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onChangeSettings = functions.firestore
  .document('users/{userId}/singles/settings')
  .onWrite((change, context) => {
    return admin
      .firestore()
      .doc(`users/${context.params.userId}`)
      .update({
        settings_changed: admin.firestore.FieldValue.serverTimestamp()
      })
      .then(() => true);
  });
