import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as firebase from 'firebase/app';

interface Homework {
  id?: string;
  title: string;
  details?: string;
  until: {
    date: firebase.firestore.Timestamp;
    lesson: number;
  };
  entered: {
    date: firebase.firestore.Timestamp;
    lesson: number;
  };
  attachments?: object[];
  course?: {
    id: string;
    subject: string;
    short: string;
    color: string;
  };
  corrections?: {
    [id: string]: {
      title?: string;
      details?: string;
      delete?: true;
      by: {
        id: string;
        name?: {
          first_name: string;
          last_name: string;
        };
        roles?: {
          [role: string]: boolean;
        };
      };
    };
  };
  corrected?: boolean;
}

export const onChangeHomework = functions.firestore
  .document('years/{year}/courses/{courseId}/homework/{homeworkId}')
  .onWrite((change, context) => {
    const newValue = change.after.data()! as Homework;
    const previousValue = change.before.data()! as Homework;
    const year = context.params.year;
    const courseId = context.params.courseId;
    const homeworkId = context.params.homeworkId;

    if (newValue) {
      if (!newValue.title) return false;
      if (!newValue.entered || !newValue.entered.date) return false;
      if (!newValue.until || !newValue.until.date) return false;
    }

    let getDate = (date: firebase.firestore.Timestamp): Date => {
      let newDate = date.toDate();
      newDate.setHours(0);
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      return newDate;
    };

    let isCorrected = (): boolean => {
      if (!newValue.corrections) return false;
      if (!(typeof newValue.corrections == 'object')) return false;
      return !!Object.keys(newValue.corrections).length;
    };

    let min = new Date();
    min.setDate(min.getDate() - 14);
    min.setHours(0);
    min.setMinutes(0);
    min.setSeconds(0);
    min.setMilliseconds(0);

    let max = new Date();
    max.setDate(min.getDate() + 14);
    max.setHours(0);
    max.setMinutes(0);
    max.setSeconds(0);
    max.setMilliseconds(0);

    if (
      (newValue &&
        getDate(newValue.entered.date).getTime() >= min.getTime() &&
        getDate(newValue.until.date).getDate() <= max.getTime()) ||
      (previousValue &&
        getDate(previousValue.entered.date).getTime() >= min.getTime() &&
        getDate(previousValue.until.date).getDate() <= max.getTime())
    ) {
      let addCurrent =
        newValue &&
        newValue.entered &&
        getDate(newValue.entered.date).getTime() >= min.getTime() &&
        getDate(newValue.until.date).getDate() <= max.getTime();
      return admin
        .firestore()
        .doc(`years/${year}/courses/${courseId}/homework/--index--`)
        .get()
        .then((indexSnap): any => {
          if (indexSnap.exists) {
            let index = indexSnap.data() as { homework: Homework[] };
            index.homework = index.homework.filter(
              h =>
                getDate(h.entered.date).getTime() >= min.getTime() &&
                getDate(h.until.date).getDate() <= max.getTime() &&
                h.id !== homeworkId
            );
            if (addCurrent)
              index.homework.push({
                id: homeworkId,
                title: newValue.title,
                entered: newValue.entered,
                until: newValue.until,
                corrected: isCorrected()
              });
            return admin
              .firestore()
              .doc(indexSnap.ref.path)
              .update(index)
              .then(() => {
                return admin
                  .firestore()
                  .doc(`years/${year}`)
                  .update({
                    [`homework_updated.${courseId}`]: admin.firestore.FieldValue.serverTimestamp()
                  });
              });
          } else if (addCurrent) {
            return admin
              .firestore()
              .doc(indexSnap.ref.path)
              .set({
                homework: [
                  {
                    id: homeworkId,
                    title: newValue.title,
                    entered: newValue.entered,
                    until: newValue.until,
                    corrected: isCorrected()
                  }
                ],
                index: true
              })
              .then(() => {
                return admin
                  .firestore()
                  .doc(`years/${year}`)
                  .update({
                    [`homework_updated.${courseId}`]: admin.firestore.FieldValue.serverTimestamp()
                  });
              });
          }
        });
    }
    return false;
  });

export const onChangePersonalHomework = functions.firestore
  .document('users/{userId}/personalHomework/{homeworkId}')
  .onWrite((change, context) => {
    const newValue = change.after.data()! as Homework;
    const previousValue = change.before.data()! as Homework;
    const userId = context.params.userId;
    const homeworkId = context.params.homeworkId;

    if (newValue) {
      if (!newValue.title) return false;
      if (!newValue.entered || !newValue.entered.date) return false;
      if (!newValue.until || !newValue.until.date) return false;
      if (!newValue.course) return false;
    }

    let getDate = (date: firebase.firestore.Timestamp): Date => {
      let newDate = date.toDate();
      newDate.setHours(0);
      newDate.setMinutes(0);
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      return newDate;
    };

    let isCorrected = (): boolean => {
      if (!newValue.corrections) return false;
      if (!(typeof newValue.corrections == 'object')) return false;
      return !!Object.keys(newValue.corrections).length;
    };

    let min = new Date();
    min.setDate(min.getDate() - 14);
    min.setHours(0);
    min.setMinutes(0);
    min.setSeconds(0);
    min.setMilliseconds(0);

    let max = new Date();
    max.setDate(min.getDate() + 14);
    max.setHours(0);
    max.setMinutes(0);
    max.setSeconds(0);
    max.setMilliseconds(0);

    if (
      (newValue &&
        getDate(newValue.entered.date).getTime() >= min.getTime() &&
        getDate(newValue.until.date).getDate() <= max.getTime()) ||
      (previousValue &&
        getDate(previousValue.entered.date).getTime() >= min.getTime() &&
        getDate(previousValue.until.date).getDate() <= max.getTime())
    ) {
      let addCurrent =
        newValue &&
        newValue.entered &&
        getDate(newValue.entered.date).getTime() >= min.getTime() &&
        getDate(newValue.until.date).getDate() <= max.getTime();
      return admin
        .firestore()
        .doc(`users/${userId}/personalHomework/--index--`)
        .get()
        .then((indexSnap): any => {
          if (indexSnap.exists) {
            let index = indexSnap.data() as { homework: Homework[] };
            index.homework = index.homework.filter(
              h =>
                getDate(h.entered.date).getTime() >= min.getTime() &&
                getDate(h.until.date).getDate() <= max.getTime() &&
                h.id !== homeworkId
            );
            if (addCurrent)
              index.homework.push({
                id: homeworkId,
                title: newValue.title,
                entered: newValue.entered,
                until: newValue.until,
                course: newValue.course,
                corrected: isCorrected()
              });
            return admin
              .firestore()
              .doc(indexSnap.ref.path)
              .update(index)
              .then(() => {
                return admin
                  .firestore()
                  .doc(`users/${userId}`)
                  .update({
                    homework_updated: admin.firestore.FieldValue.serverTimestamp()
                  });
              });
          } else if (addCurrent) {
            return admin
              .firestore()
              .doc(indexSnap.ref.path)
              .set({
                homework: [
                  {
                    id: homeworkId,
                    title: newValue.title,
                    entered: newValue.entered,
                    until: newValue.until,
                    course: newValue.course,
                    corrected: isCorrected()
                  }
                ],
                index: true
              })
              .then(() => {
                return admin
                  .firestore()
                  .doc(`users/${userId}`)
                  .update({
                    homework_updated: admin.firestore.FieldValue.serverTimestamp()
                  });
              });
          }
        });
    }
    return false;
  });
