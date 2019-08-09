import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onChangeCourse = functions.firestore
  .document('years/{year}/courses/{courseId}')
  .onUpdate((change, context) => {
    const newValue = change.after.data()!;
    const previousValue = change.before.data()!;
    // const year = context.params.year;
    const courseId = context.params.courseId;

    console.log('triggered ' + courseId);

    if (!newValue.multi && !previousValue.multi) {
      [...new Set([...newValue.class, ...previousValue.class])].forEach(
        clazz => {
          admin
            .firestore()
            .collection('users')
            .where('class', '==', clazz)
            .get()
            .then(users => {
              users.docs.forEach(user => {
                admin
                  .firestore()
                  .doc(`users/${user.id}/singles/timetable`)
                  .get()
                  .then(timetable => {
                    if (timetable.exists && !timetable.data().outdated) {
                      console.log('updated ' + user.id);
                      admin
                        .firestore()
                        .doc(`users/${user.id}/singles/timetable`)
                        .update({ outdated: true });
                    }
                  });
              });
            });
        }
      );
    } else {
      [...new Set([...newValue.class, ...previousValue.class])].forEach(
        clazz => {
          admin
            .firestore()
            .collection('users')
            .where('class', '==', clazz)
            .where('courses', 'array-contains', courseId)
            .get()
            .then(users => {
              users.docs.forEach(user => {
                admin
                  .firestore()
                  .doc(`users/${user.id}/singles/timetable`)
                  .get()
                  .then(timetable => {
                    if (timetable.exists && !timetable.data().outdated) {
                      console.log('updated ' + user.id);
                      admin
                        .firestore()
                        .doc(`users/${user.id}/singles/timetable`)
                        .update({ outdated: true });
                    }
                  });
              });
            });
        }
      );
    }
    return true;
  });
