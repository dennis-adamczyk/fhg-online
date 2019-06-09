export interface User {
  id?: string;
  email: string;
  name: {
    first_name: string;
    last_name: string;
  };
  class?: string | Array<string>;
  roles: {
    admin: boolean;
    guard: boolean;
    student: boolean;
    teacher: boolean;
  };
  status: number;
  settings_changed?: firebase.firestore.Timestamp;
}
