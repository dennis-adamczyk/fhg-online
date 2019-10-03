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
    const data = snap.data();
    const objectID = snap.id;
    if (objectID == indexId) return;

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
    if ((data.content as string).endsWith(' '))
      data.content = (data.content as string).substr(
        0,
        (data.content as string).length - 1
      );

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
    if (objectID == indexId) return;

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
    const data = change.after.data();
    const objectID = change.after.id;
    if (objectID == indexId) return;

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
    if ((data.content as string).endsWith(' '))
      data.content = (data.content as string).substr(
        0,
        (data.content as string).length - 1
      );

    return index.saveObject({
      objectID,
      title: data.title,
      content: data.content
    });
  });
