import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onChangeSettings = functions.firestore
  .document('users/{userId}/singles/settings')
  .onUpdate((change, context) => {
    const data: FirebaseFirestore.DocumentData = change.after.data() || {
      updated_at: false
    };
    return admin
      .firestore()
      .doc(`users/${context.params.userId}`)
      .update({
        settings_changed:
          data['updated_at'] || admin.firestore.FieldValue.serverTimestamp()
      });
  });
