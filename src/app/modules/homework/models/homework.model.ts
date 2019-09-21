import { Course } from '../../timetable/models/timetable.model';

export interface Homework {
  id?: string;
  title: string;
  details?: string;
  until: {
    date: firebase.firestore.Timestamp | Date;
    lesson: number;
  };
  entered: {
    date: firebase.firestore.Timestamp | Date;
    lesson: number;
  };
  attachments?: object[];
  course?:
    | {
        id: string;
        subject: string;
        short: string;
        color: string;
      }
    | Course;
  personal?: boolean;
  done?: boolean;
  by?: {
    id: string;
    name?: {
      first_name: string;
      last_name: string;
    };
    roles?: {
      [role: string]: boolean;
    };
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
  selectedCorrection?: object;
  reporter?: string[];
  blocked?: boolean;
}
