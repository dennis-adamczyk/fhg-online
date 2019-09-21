import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onChangeCourse = functions.firestore
  .document('years/{year}/courses/{courseId}')
  .onWrite((change, context) => {
    const newValue = change.after.data();
    // const previousValue = change.before.data()!;
    const year = context.params.year;
    const courseId = context.params.courseId;

    if (!newValue)
      return admin
        .firestore()
        .doc(`years/${year}`)
        .update({
          [`updated.${courseId}`]: null
        });

    return admin
      .firestore()
      .doc(`years/${year}`)
      .update({
        [`updated.${courseId}`]: admin.firestore.FieldValue.serverTimestamp()
      });
  });
