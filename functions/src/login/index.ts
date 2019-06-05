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

  // Validation

  if (context.auth) {
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
    !email.split('@')[0].match(/^([\w-]+\.[\w-]+)+$/)
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
    !name.first_name.match(/^([\wÄäÖöÜüÉÈéèÇç]+-?[\wÄäÖöÜüÉÈéèÇç]+\s?)+$/) ||
    !name.last_name.match(/^([\wÄäÖöÜüÉÈéèÇç]+-?[\wÄäÖöÜüÉÈéèÇç]+\s?)+$/)
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
    .catch(error => null);

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
      emailVerified: false,
      phoneNumber: undefined,
      password: password,
      displayName: name.first_name + ' ' + name.last_name,
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
          status: 0,
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
