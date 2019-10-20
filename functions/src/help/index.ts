import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as algoliasearch from 'algoliasearch';

const indexId = '--index--';

const env = functions.config().algolia;

const client = algoliasearch(env.appid, env.apikey);
const index = client.initIndex('help');

export const onCreateHelp = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .firestore.document('help/{helpId}')
  .onCreate((snap, context) => {
    const data = snap.data()! as { title: string; content: string };
    const objectID = snap.id;
    if (objectID == indexId || !data) return false;

    admin.firestore().runTransaction(t => {
      let indexRef = admin.firestore().doc(`help/${indexId}`);
      return t.get(indexRef).then(doc => {
        let indexData = doc.data();
        if (!indexData) indexData = { articles: [] };

        if (!data.title && doc.exists) return;

        indexData.articles.push({
          id: objectID,
          title: data.title
        });

        return t.set(indexRef, indexData);
      });
    });

    data.content = data.content.replace(/(\w)<\/h2[^>]*>+/gm, '$1: ');
    data.content = data.content.replace(/(\w)<\/h3[^>]*>+/gm, '$1: ');
    data.content = data.content.replace(/(\w)<\/p[^>]*>+/gm, '$1. ');
    data.content = data.content.replace(/<\/p[^>]*>+/gm, ' ');
    data.content = data.content.replace(/<\/[^>]*>?/gm, ' ');
    data.content = data.content.replace(/<[^>]*>?/gm, '');
    if (data.content.endsWith(' '))
      data.content = data.content.substr(0, data.content.length - 1);

    return index.addObject({
      objectID,
      title: data.title,
      content: data.content
    });
  });

export const onDeleteHelp = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .firestore.document('help/{helpId}')
  .onDelete((snap, context) => {
    const objectID = snap.id;
    if (objectID == indexId) return false;

    admin.firestore().runTransaction(t => {
      let indexRef = admin.firestore().doc(`help/${indexId}`);
      return t.get(indexRef).then(doc => {
        let indexData = doc.data();
        if (!indexData) indexData = { articles: [] };

        indexData.articles = indexData.articles.filter(
          (a: any) => a.id !== objectID
        );

        return t.set(indexRef, indexData);
      });
    });

    return index.deleteObject(objectID);
  });

export const onUpdateHelp = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '1GB'
  })
  .firestore.document('help/{helpId}')
  .onUpdate((change, context) => {
    const data = change.after.data()! as { title: string; content: string };
    const objectID = change.after.id;
    if (objectID == indexId || !data) return false;

    admin.firestore().runTransaction(t => {
      let indexRef = admin.firestore().doc(`help/${indexId}`);
      return t.get(indexRef).then(doc => {
        let indexData = doc.data();
        if (!indexData) indexData = { articles: [] };

        if (!data.title && doc.exists) return;

        indexData.articles = indexData.articles.filter(
          (a: any) => a.id !== objectID
        );
        indexData.articles.push({
          id: objectID,
          title: data.title
        });

        return t.set(indexRef, indexData);
      });
    });

    data.content = data.content.replace(/(\w)<\/h2[^>]*>+/gm, '$1: ');
    data.content = data.content.replace(/(\w)<\/h3[^>]*>+/gm, '$1: ');
    data.content = data.content.replace(/(\w)<\/p[^>]*>+/gm, '$1. ');
    data.content = data.content.replace(/<\/p[^>]*>+/gm, ' ');
    data.content = data.content.replace(/<\/[^>]*>?/gm, ' ');
    data.content = data.content.replace(/<[^>]*>?/gm, '');
    if (data.content.endsWith(' '))
      data.content = data.content.substr(0, data.content.length - 1);

    return index.saveObject({
      objectID,
      title: data.title,
      content: data.content
    });
  });

/* ===== REQUESTS ===== */

export const onCreateRequest = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB'
  })
  .firestore.document('requests/{requestId}')
  .onCreate((snap, context) => {
    const data = snap.data()!;
    const requestId = snap.id;
    if (requestId == indexId || !data) return false;

    admin
      .firestore()
      .collection('users')
      .where('roles.guard', '==', true)
      .get()
      .then(guards => {
        if (guards.empty || !guards.size || !guards.docs.length) return;
        let batch = admin.firestore().batch();
        guards.docs.forEach(guard => {
          if (guard.data().newAdminRequest == true) return;
          batch.update(guard.ref, { newAdminRequest: true });
        });
        batch.commit();
      });

    return admin.firestore().runTransaction(t => {
      let indexRef = admin.firestore().doc(`requests/${indexId}`);
      return t.get(indexRef).then(doc => {
        let indexData = doc.data();
        if (!indexData) indexData = { requests: [] };

        if (!data.type && doc.exists) return;

        let add: any = {
          id: requestId,
          type: data.type
        };

        if (
          data.by.id &&
          data.by.email &&
          data.by.name.first_name &&
          data.by.name.last_name
        )
          add.by = {
            id: data.by.id,
            email: data.by.email,
            name: data.by.name
          };

        if (data.created_at) add.created_at = data.created_at;

        indexData.requests.push(add);

        return t.set(indexRef, indexData);
      });
    });
  });

export const onDeleteRequest = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB'
  })
  .firestore.document('requests/{requestId}')
  .onDelete((snap, context) => {
    const requestId = snap.id;
    if (requestId == indexId) return false;

    return admin.firestore().runTransaction(t => {
      let indexRef = admin.firestore().doc(`requests/${indexId}`);
      return t.get(indexRef).then(doc => {
        let indexData = doc.data();
        if (!indexData) indexData = { requests: [] };

        indexData.requests = indexData.requests.filter(
          (a: any) => a.id !== requestId
        );

        return t.set(indexRef, indexData);
      });
    });
  });

export const onUpdateRequest = functions
  .runWith({
    timeoutSeconds: 300,
    memory: '2GB'
  })
  .firestore.document('requests/{requestId}')
  .onUpdate((change, context) => {
    const data = change.after.data()!;
    const requestId = change.after.id;
    if (requestId == indexId || !data) return false;

    admin
      .firestore()
      .collection('users')
      .where('roles.guard', '==', true)
      .get()
      .then(guards => {
        if (guards.empty || !guards.size || !guards.docs.length) return;
        let batch = admin.firestore().batch();
        guards.docs.forEach(guard => {
          if (guard.data().newAdminRequest == true) return;
          batch.update(guard.ref, { newAdminRequest: true });
        });
        batch.commit();
      });

    return admin.firestore().runTransaction(t => {
      let indexRef = admin.firestore().doc(`requests/${indexId}`);
      return t.get(indexRef).then(doc => {
        let indexData = doc.data();
        if (!indexData) indexData = { requests: [] };

        if (!data.type && doc.exists) return;

        indexData.requests = indexData.requests.filter(
          (a: any) => a.id !== requestId
        );

        let add: any = {
          id: requestId,
          type: data.type
        };
        if (
          data.by.id &&
          data.by.email &&
          data.by.name.first_name &&
          data.by.name.last_name
        )
          add.by = {
            id: data.by.id,
            email: data.by.email,
            name: data.by.name
          };
        if (data.created_at) add.created_at = data.created_at;
        indexData.requests.push(add);

        return t.set(indexRef, indexData);
      });
    });
  });
