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
  corrected?: string[];
  reporter?: string[];
  blocked?: boolean;
}

export const onChangeHomework = functions.firestore
  .document('years/{year}/courses/{courseId}/homework/{homeworkId}')
  .onWrite(async (change, context) => {
    const newValue = change.after.data()! as Homework;
    const previousValue = change.before.data()! as Homework;
    const year = context.params.year;
    const courseId = context.params.courseId as string;
    const homeworkId = context.params.homeworkId as string;

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

    let getCorrected = (): string[] => {
      if (!newValue.corrections) return [];
      if (!(typeof newValue.corrections == 'object')) return [];
      let output = [];
      for (const key in newValue.corrections) {
        if (newValue.corrections.hasOwnProperty(key)) {
          const element = newValue.corrections[key];
          if (
            element.title !== newValue.title ||
            element.details !== newValue.details
          )
            output.push(key);
        }
      }
      return output;
    };

    let isBlocked = async (): Promise<boolean> => {
      if (!newValue.reporter || !newValue.reporter.length) return false;
      let amount = newValue.reporter.length;
      const ratio = 0.25;

      let clazz = courseId.match(/^(\d[^\-])/)[0];
      if (clazz) {
        return admin
          .firestore()
          .collection(`users`)
          .where('class', '==', clazz)
          .get()
          .then(members => {
            return amount >= members.docs.length * ratio;
          });
      } else {
        return admin
          .firestore()
          .collection(`users`)
          .where('course', 'array-contains', courseId)
          .get()
          .then(members => {
            return amount >= members.docs.length * ratio;
          });
      }
    };
    const blocked = await isBlocked();

    change.after.ref.update({
      blocked: blocked
    });

    let min = new Date();
    min.setDate(min.getDate() - 14);
    min.setHours(0);
    min.setMinutes(0);
    min.setSeconds(0);
    min.setMilliseconds(0);

    if (
      (newValue && getDate(newValue.entered.date).getTime() >= min.getTime()) ||
      (previousValue &&
        getDate(previousValue.entered.date).getTime() >= min.getTime())
    ) {
      let addCurrent =
        newValue &&
        newValue.entered &&
        getDate(newValue.entered.date).getTime() >= min.getTime();
      return admin
        .firestore()
        .doc(`years/${year}/courses/${courseId}/homework/--index--`)
        .get()
        .then(
          async (indexSnap): Promise<any> => {
            if (indexSnap.exists) {
              let index = indexSnap.data() as { homework: Homework[] };
              index.homework = index.homework.filter(
                h =>
                  getDate(h.entered.date).getTime() >= min.getTime() &&
                  h.id !== homeworkId
              );
              if (addCurrent)
                index.homework.push({
                  id: homeworkId,
                  title: newValue.title,
                  entered: newValue.entered,
                  until: newValue.until,
                  corrected: getCorrected(),
                  blocked: blocked
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
                      corrected: getCorrected(),
                      blocked: blocked
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
          }
        );
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

    let min = new Date();
    min.setDate(min.getDate() - 14);
    min.setHours(0);
    min.setMinutes(0);
    min.setSeconds(0);
    min.setMilliseconds(0);

    if (
      (newValue && getDate(newValue.entered.date).getTime() >= min.getTime()) ||
      (previousValue &&
        getDate(previousValue.entered.date).getTime() >= min.getTime())
    ) {
      let addCurrent =
        newValue &&
        newValue.entered &&
        getDate(newValue.entered.date).getTime() >= min.getTime();
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
                h.id !== homeworkId
            );
            if (addCurrent)
              index.homework.push({
                id: homeworkId,
                title: newValue.title,
                entered: newValue.entered,
                until: newValue.until,
                course: newValue.course
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
                    course: newValue.course
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
