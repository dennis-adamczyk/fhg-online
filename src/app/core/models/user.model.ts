export interface User {
  id?: string;
  email: string;
  name: {
    first_name: string;
    last_name: string;
  };
  class?: string;
  courses: Array<string>;
  roles: {
    admin: boolean;
    guard: boolean;
    student: boolean;
    teacher: boolean;
  };
  status: number;
  sanctions?: {
    interaction?: {
      since: firebase.firestore.Timestamp | Date;
      by: { id: string; name: string };
      until?: firebase.firestore.Timestamp | Date;
      permanent: boolean;
      reason: string;
    };
    block?: {
      since: firebase.firestore.Timestamp | Date;
      by: { id: string; name: string };
      until?: firebase.firestore.Timestamp | Date;
      permanent: boolean;
      reason: string;
    };
    ban?: {
      since: firebase.firestore.Timestamp | Date;
      by: { id: string; name: string };
      reason: string;
    };
  };
  settings_changed?: firebase.firestore.Timestamp;
  homework_updated?: firebase.firestore.Timestamp;
  created_at?: firebase.firestore.Timestamp;
  updated_at?: firebase.firestore.Timestamp;
}
