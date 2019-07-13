import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/lib/providers/https';

export const registerUser = functions.https.onCall((data, context) => {
  // Get data
  const role: string = data.role;
  const email: string = data.email;
  const name: { first_name: string; last_name: string } = {
    first_name: data.name.first_name as string,
    last_name: data.name.last_name as string
  };
  const password: string = data.password;
  const clazz: string | null = data.class || null;
  const skipVerification: boolean = data.skipVerification || false;

  // Validation

  if (context.auth && !skipVerification) {
    throw new HttpsError(
      'failed-precondition',
      'Fehler beim Ausführen der Funktion im authentifizierten Zustand.'
    );
  }
  if (!(typeof role === 'string') || role.length == 0) {
    throw new HttpsError(
      'failed-precondition',
      'Die Rolle wurde nicht übergeben.'
    );
  }
  if (!(role == 'student' || role == 'teacher')) {
    throw new HttpsError('failed-precondition', 'Die Rolle ist ungültig.');
  }
  if (!(typeof email === 'string') || email.length == 0) {
    throw new HttpsError(
      'failed-precondition',
      'Die E-Mail wurde nicht übergeben.'
    );
  }
  if (
    !email.endsWith('@franz-haniel-gymnasium.eu') ||
    !email.split('@')[0].match(/^([a-zA-Z-]+\.[a-zA-Z-]+)+$/)
  ) {
    throw new HttpsError('failed-precondition', 'Die E-Mail ist ungültig.');
  }
  if (
    !(typeof name === 'object') ||
    Object.keys(name).length == 0 ||
    name.first_name.length == 0 ||
    name.last_name.length == 0
  ) {
    throw new HttpsError(
      'failed-precondition',
      'Der Name wurde nicht übergeben.'
    );
  }
  if (
    !name.first_name.match(
      /^([a-zA-ZÄäÖöÜüÉÈéèÇç]+-?[a-zA-ZÄäÖöÜüÉÈéèÇç]+\s?)+$/
    ) ||
    !name.last_name.match(
      /^([a-zA-ZÄäÖöÜüÉÈéèÇç]+-?[a-zA-ZÄäÖöÜüÉÈéèÇç]+\s?)+$/
    )
  ) {
    throw new HttpsError('failed-precondition', 'Die Name ist ungültig.');
  }
  if (!(typeof password === 'string') || password.length == 0) {
    throw new HttpsError(
      'failed-precondition',
      'Das Passwort wurde nicht übergeben.'
    );
  }
  if (password.length < 6) {
    throw new HttpsError('failed-precondition', 'Das Passwort ist ungültig.');
  }
  if (clazz !== null && (!(typeof clazz === 'string') || clazz.length == 0)) {
    throw new HttpsError(
      'failed-precondition',
      'Die Klasse wurde nicht korrekt übergeben.'
    );
  }
  if (clazz !== null && !clazz.match(/^[5-9][a-f]|EF|Q1|Q2$/i)) {
    throw new HttpsError('failed-precondition', 'Die Klasse ist ungültig.');
  }

  // Async Validation

  admin
    .firestore()
    .collection('users')
    .where('email', '==', email)
    .get()
    .then(data => {
      if (data.size) {
        throw new HttpsError(
          'failed-precondition',
          'Die E-Mail ist bereits vergeben.'
        );
      }
    });

  admin
    .auth()
    .getUserByEmail(email)
    .then(userRecord => {
      if (userRecord.uid) {
        throw new HttpsError(
          'failed-precondition',
          'Die E-Mail ist bereits vergeben.'
        );
      }
    })
    .catch();

  admin
    .firestore()
    .collection('users')
    .where('index', '==', true)
    .where('teachers', 'array-contains', email)
    .get()
    .then(data => {
      if (role == 'teacher' && data.size == 0) {
        throw new HttpsError(
          'failed-precondition',
          'Die E-Mail gehört keinem Leherer.'
        );
      }
    });

  // Registration

  return admin
    .auth()
    .createUser({
      email: email,
      emailVerified: skipVerification,
      phoneNumber: undefined,
      password: password,
      displayName: name.last_name + ', ' + name.first_name,
      photoURL: undefined,
      disabled: false
    })
    .then(userRecord => {
      admin
        .firestore()
        .doc(`users/${userRecord.uid}`)
        .create({
          email: email,
          name: name,
          roles: {
            guard: false,
            admin: false,
            student: role == 'student' ? true : false,
            teacher: role == 'teacher' ? true : false
          },
          class: clazz ? clazz : undefined,
          courses: [],
          status: skipVerification ? 1 : 0,
          settings_changed: null,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          created_at: admin.firestore.FieldValue.serverTimestamp()
        });
      return admin
        .auth()
        .setCustomUserClaims(userRecord.uid, {
          guard: false,
          admin: false,
          student: role == 'student' ? true : false,
          teacher: role == 'teacher' ? true : false
        })
        .then(() => {
          return admin
            .auth()
            .createCustomToken(userRecord.uid)
            .then(token => {
              return { user: userRecord, token: token };
            });
        });
    });
});

export const onChangeUser = functions.firestore
  .document('users/{userId}')
  .onUpdate((change, context) => {
    const newValue = change.after.data()!;
    const previousValue = change.before.data()!;
    const uid = context.params.userId;

    if (newValue.roles != previousValue.roles) {
      admin.auth().setCustomUserClaims(uid, {
        guard: newValue.roles.guard,
        admin: newValue.roles.admin,
        student: newValue.roles.student,
        teacher: newValue.roles.teacher
      });
    }
    if (newValue.name != previousValue.name) {
      admin.auth().updateUser(uid, {
        displayName: newValue.name.last_name + ', ' + newValue.name.first_name
      });
    }
    return true;
  });

export const onDeleteUser = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .firestore.document('users/{userId}')
  .onWrite((change, context) => {
    if (!change.after.exists || !change.after.data()) {
      const path = `users/${context.params.userId}`;
      return admin
        .firestore()
        .doc(path)
        .listCollections()
        .then(collections => {
          return collections.forEach(collection => {
            return deleteCollection(admin.firestore(), collection.path);
          });
        });
    }
    return false;
  });

function deleteCollection(db: any, collectionPath: any) {
  let collectionRef = db.collection(collectionPath);
  let query = collectionRef.orderBy('__name__');

  return new Promise((resolve, reject) => {
    deleteQueryBatch(db, query, resolve, reject);
  });
}

function deleteQueryBatch(db: any, query: any, resolve: any, reject: any) {
  query
    .get()
    .then((snapshot: any) => {
      // When there are no documents left, we are done
      if (snapshot.size == 0) {
        return 0;
      }

      // Delete documents in a batch
      let batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      return batch.commit().then(() => {
        return snapshot.size;
      });
    })
    .then((numDeleted: any) => {
      if (numDeleted === 0) {
        resolve();
        return;
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(() => {
        deleteQueryBatch(db, query, resolve, reject);
      });
    })
    .catch(reject);
}
