export interface Course {
  class: string[];
  lessons: object;
  multi: boolean;
  short: string;
  subject: string;
  room: string;
  teacher: {
    last_name: string;
    title: string;
    short: string;
  };
  color: string;
  id?: string;
}

export interface TimetableLocalStorage {
  updated: number;
  courses: Course[];
}
