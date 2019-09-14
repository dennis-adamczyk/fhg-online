import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/lib/providers/https';

export const getUsers = functions.https.onCall((data, context) => {
  // Validation
  if (!context.auth) {
    throw new HttpsError(
      'failed-precondition',
      'Fehler beim Ausführen der Funktion im unauthentifizierten Zustand.'
    );
  }
  if (
    !admin
      .auth()
      .getUser(context.auth.uid)
      .then(userRecord => {
        return (userRecord.customClaims as { guard: boolean })!.guard == true;
      })
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Unzureichende Berechtigungen zum Ausführen der Funktion.'
    );
  }

  function getRoleName(rolesObj: object): string | undefined {
    const roles = rolesObj as {
      guard: boolean;
      admin: boolean;
      teacher: boolean;
      student: boolean;
    };
    if (roles.guard) {
      return 'guard';
    }
    if (roles.admin) {
      return 'admin';
    }
    if (roles.teacher) {
      return 'teacher';
    }
    if (roles.student) {
      return 'student';
    }
    return undefined;
  }

  function getDateFormat(dateSrc: string | number) {
    const date = new Date(dateSrc);
    var dd: any = date.getDate();

    var mm: any = date.getMonth() + 1;
    var yyyy = date.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }

    if (mm < 10) {
      mm = '0' + mm;
    }

    return `${dd}.${mm}.${yyyy}`;
  }

  var users: Object[] = [];

  function listAllUsers(nextPageToken?: string): Promise<void | Object[]> {
    return admin
      .auth()
      .listUsers(1000, nextPageToken)
      .then(listUsersResult => {
        listUsersResult.users.forEach(function(userRecord) {
          users.push({
            uid: userRecord.uid,
            name: userRecord.displayName,
            role:
              userRecord.customClaims != undefined
                ? getRoleName(userRecord.customClaims!)
                : '',
            last_login:
              userRecord.metadata.lastSignInTime != undefined
                ? getDateFormat(userRecord.metadata.lastSignInTime)
                : ''
          });
        });

        if (listUsersResult.pageToken) {
          // List next batch of users.
          return listAllUsers(listUsersResult.pageToken);
        } else {
          return users;
        }
      })
      .catch(function(error) {
        console.error('Error listing users:', error);
      });
  }

  return listAllUsers().then(users => {
    return users;
  });
});

export const deleteUser = functions.https.onCall((data, context) => {
  // Get data
  const uid: string = data.uid;

  // Validation
  if (!context.auth) {
    throw new HttpsError(
      'failed-precondition',
      'Fehler beim Ausführen der Funktion im unauthentifizierten Zustand.'
    );
  }
  if (
    !admin
      .auth()
      .getUser(context.auth.uid)
      .then(userRecord => {
        return (userRecord.customClaims as { guard: boolean })!.guard == true;
      })
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Unzureichende Berechtigungen zum Ausführen der Funktion.'
    );
  }
  if (!uid || typeof uid !== 'string' || uid.length == 0) {
    throw new HttpsError(
      'failed-precondition',
      'Parameter UID wurde nicht übergeben.'
    );
  }

  return admin
    .firestore()
    .doc(`users/${uid}`)
    .delete()
    .then(() => {
      return admin.auth().deleteUser(uid);
    });
});

export const deleteUsers = functions.https.onCall((data, context) => {
  // Get data
  const uids: string[] = data.uids;

  // Validation
  if (!context.auth) {
    throw new HttpsError(
      'failed-precondition',
      'Fehler beim Ausführen der Funktion im unauthentifizierten Zustand.'
    );
  }

  if (
    !admin
      .auth()
      .getUser(context.auth.uid)
      .then(userRecord => {
        return (userRecord.customClaims as { guard: boolean })!.guard == true;
      })
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Unzureichende Berechtigungen zum Ausführen der Funktion.'
    );
  }
  if (!uids || uids.length == 0) {
    throw new HttpsError(
      'failed-precondition',
      'Parameter UIDs wurde nicht übergeben.'
    );
  }

  let batch = admin.firestore().batch();
  uids.forEach(uid => {
    batch.delete(admin.firestore().doc(`users/${uid}`));
    admin.auth().deleteUser(uid);
  });

  return batch.commit();
});
