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
        pattern: 'Benutze das Format <Vorname>.<Nachname>',
        notFound: 'E-Mail nicht vergeben'
      },
      password: {
        required: 'Passwort benötigt',
        wrong: 'Falsches Passwort'
      }
    }
  }
};
