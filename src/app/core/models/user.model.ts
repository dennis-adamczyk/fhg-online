export class User {
  id?: string;
  email: string;
  name: {
    first_name: string;
    last_name: string;
  };
  class: string;
  roles: {
    admin: boolean;
    guard: boolean;
    student: boolean;
    teacher: boolean;
  };
  status: number;
  settingsChanged?: any;
}
