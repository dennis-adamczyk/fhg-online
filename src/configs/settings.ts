export class Settings {
  appearance: {
    style: 'colored' | 'monotone_primary' | 'monotone_gray';
  } = {
    style: 'colored'
  };
  home: {
    calendar_entries: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
    show_days_off: boolean;
  } = {
    calendar_entries: 5,
    show_days_off: false
  };
  timetable: {
    subjects_abbreviation: boolean;
    teacher_abbreviation: boolean;
    show_teacher: boolean;
    show_room: boolean;
    show_lesson_number: boolean;
    show_lesson_time: boolean;
  } = {
    subjects_abbreviation: true,
    teacher_abbreviation: true,
    show_teacher: true,
    show_room: true,
    show_lesson_number: true,
    show_lesson_time: true
  };
  homework: {
    sort_by: 'due_day' | 'entered';
    max_days: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
  } = {
    sort_by: 'due_day',
    max_days: 5
  };
  calendar: {} = {};
}

export const language = {
  appearance: {
    title: 'Aussehen',
    style: {
      title: 'Stil',
      value: {
        colored: 'Farbig',
        monotone_primary: 'Monoton Primärfarbe',
        monotone_gray: 'Monoton Grau'
      }
    }
  },
  home: {
    title: 'Übersicht',
    calendar_entries: {
      title: 'Anzahl der Kalendereinträge',
      value: {
        min: 3,
        max: 10,
        suffix: 'Einträge'
      }
    },
    show_days_off: {
      title: 'Freie Tage anzeigen',
      description: 'Anzeigen in der Kalenderübersicht'
    }
  },
  timetable: {
    title: 'Stundenplan',
    subjects_abbreviation: {
      title: 'Fächerkürzel verwenden'
    },
    teacher_abbreviation: {
      title: 'Lehrerkürzel verwenden'
    },
    show_teacher: {
      title: 'Lehrer anzeigen'
    },
    show_room: {
      title: 'Raum anzeigen'
    },
    show_lesson_number: {
      title: 'Stundennummer anzeigen'
    },
    show_lesson_time: {
      title: 'Stundenzeiten anzeigen'
    }
  },
  homework: {
    title: 'Hausaufgaben',
    sort_by: {
      title: 'Sortieren nach',
      value: {
        due_day: 'Fälligkeitsdatum',
        entered: 'Aufgabetag'
      }
    },
    max_days: {
      title: 'Maximale Tagesanzahl',
      value: {
        min: 3,
        max: 14,
        suffix: 'Tage'
      }
    }
  },
  calendar: {
    title: 'Kalender'
  }
};
