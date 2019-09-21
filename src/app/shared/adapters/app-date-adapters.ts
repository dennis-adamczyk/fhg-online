import { NativeDateAdapter } from '@angular/material';

export class AppDateAdapter extends NativeDateAdapter {
  format(date: Date, displayFormat: Object): string {
    if (displayFormat === 'input') {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const formatter = new Intl.DateTimeFormat('de', { weekday: 'short' });
      const weekday = formatter.format(date);

      return `${weekday}., ${this._to2digit(day)}.${this._to2digit(
        month
      )}.${year}`;
    } else if (displayFormat == { year: 'numeric', month: 'short' }) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const formatter = new Intl.DateTimeFormat('de', { month: 'short' });
      const monthFormatted = formatter.format(date);

      return `${monthFormatted}. ${year}`;
    } else if (
      displayFormat == { year: 'numeric', month: 'long', day: 'numeric' }
    ) {
      const day = date.getDate();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const formatter = new Intl.DateTimeFormat('de', { month: 'long' });
      const monthFormatted = formatter.format(date);

      return `${this._to2digit(day)}. ${monthFormatted} ${year}`;
    }

    const formatter = new Intl.DateTimeFormat('de', displayFormat);
    const formatted = formatter.format(date);

    return formatted;
  }

  private _to2digit(n: number) {
    return ('00' + n).slice(-2);
  }

  getFirstDayOfWeek(): number {
    return 1;
  }
}

export const APP_DATE_FORMATS = {
  parse: {
    dateInput: { month: 'short', year: 'numeric', day: 'numeric' }
  },
  display: {
    dateInput: 'input',
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' }
  }
};
