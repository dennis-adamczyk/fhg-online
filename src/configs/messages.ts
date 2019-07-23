export const message = {
  roles: {
    guard: 'Guard',
    admin: 'Klassenlehrer',
    teacher: 'Lehrer',
    student: 'Schüler'
  },
  errors: {
    login: {
      email: {
        required: 'E-Mail benötigt',
        minlength: 'Gib mindestens 3 Zeichen ein',
        pattern: 'Benutze das Format vorname.nachname',
        notFound: 'E-Mail nicht vergeben'
      },
      password: {
        required: 'Passwort benötigt',
        wrong: 'Falsches Passwort'
      }
    },
    register: {
      role: {
        required: 'Rolle benötigt',
        pattern: 'Gib eine gültige Rolle an'
      },
      email: {
        required: 'E-Mail benötigt',
        minlength: 'Gib mindestens 3 Zeichen ein',
        pattern: 'Benutze das Format vorname.nachname',
        alreadyExists: 'E-Mail wird bereits verwendet',
        invalidTeacher: 'Keinen Lehrer mit dieser E-Mail gefunden'
      },
      first_name: {
        required: 'Vorname benötigt',
        pattern: 'Gib einen gültigen Vornamen ein'
      },
      last_name: {
        required: 'Nachname benötigt',
        pattern: 'Gib einen gültigen Nachnamen ein'
      },
      class: {
        required: 'Klasse benötigt',
        pattern: 'Gib eine gültige Klasse an'
      },
      password1: {
        required: 'Passwort benötigt',
        minlength: 'Gib mindestens 6 Zeichen ein'
      },
      password2: {
        required: 'Wiederhole das Passwort',
        notMatch: 'Passwörter stimmen nicht überein'
      }
    },
    login_action: {
      email: {
        required: 'E-Mail benötigt',
        minlength: 'Gib mindestens 3 Zeichen ein',
        pattern: 'Benutze das Format vorname.nachname',
        notFound: 'E-Mail nicht vergeben'
      },
      password1: {
        required: 'Passwort benötigt',
        minlength: 'Gib mindestens 6 Zeichen ein'
      },
      password2: {
        required: 'Wiederhole das Passwort',
        notMatch: 'Passwörter stimmen nicht überein'
      }
    },
    admin: {
      user: {
        status: {
          required: 'Status benötigt'
        }
      },
      course: {
        subject: {
          required: 'Fach benötigt'
        },
        short: {
          required: 'Kürzel benötigt',
          pattern: 'Kürzel beinhaltet Leerzeichen',
          maxlength: 'Maximal 5 Zeichen'
        },
        room: {
          required: 'Raum benötigt',
          maxlength: 'Maximal 5 Zeichen'
        },
        teacher: {
          title: {
            required: 'Anrede benötigt',
            maxlength: 'Maximal 10 Zeichen'
          },
          last_name: {
            required: 'Nachname benötigt',
            pattern: 'Ungültiger Nachname'
          },
          short: {
            required: 'Kürzel benötigt',
            pattern: 'Kürzel beinhaltet Leerzeichen',
            maxlength: 'Maximal 5 Zeichen'
          }
        },
        class: {
          required: 'Klasse benötigt'
        },
        color: {
          required: 'Farbe benötigt'
        }
      }
    }
  }
};
