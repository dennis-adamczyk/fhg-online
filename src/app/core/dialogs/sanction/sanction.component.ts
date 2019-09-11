import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import * as firebase from 'firebase/app';
import { FirestoreService } from '../../services/firestore.service';
import { take, map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-sanction',
  templateUrl: './sanction.component.html',
  styleUrls: ['./sanction.component.sass']
})
export class SanctionDialog implements OnInit {
  constructor(
    private db: FirestoreService,
    public dialogRef: MatDialogRef<SanctionDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {}

  get sanction(): {
    since: firebase.firestore.Timestamp | Date;
    by: string;
    until?: firebase.firestore.Timestamp | Date;
    permanent?: boolean;
    reason: string;
  } {
    if (this.data.ban) return this.data.ban;
    if (this.data.block) return this.data.block;
    if (this.data.interaction) return this.data.interaction;
  }

  get sanctionName(): string {
    if (this.data.ban) return 'ban';
    if (this.data.block) return 'block';
    if (this.data.interaction) return 'interaction';
  }

  getSanctionName() {
    if (this.sanctionName == 'ban') return 'Kontoschließung';
    if (this.sanctionName == 'block') return 'Kontosperre';
    if (this.sanctionName == 'interaction') return 'Interaktionssperre';
  }

  getDateOf(date: Date | firebase.firestore.Timestamp): Date {
    if (date instanceof firebase.firestore.Timestamp) return date.toDate();
    return date;
  }

  getFormattedDateOf(date: Date | firebase.firestore.Timestamp): string {
    if (!date) return;
    if (date instanceof firebase.firestore.Timestamp)
      date = date.toDate() as Date;

    return date.toLocaleDateString();
  }

  getFormattedTimeOf(date: Date | firebase.firestore.Timestamp): string {
    if (!date) return;
    if (date instanceof firebase.firestore.Timestamp)
      date = date.toDate() as Date;

    let hours: any = date.getHours();
    let minutes: any = date.getMinutes();

    if (hours <= 9) hours = '0' + hours;
    if (minutes <= 9) minutes = '0' + minutes;

    return hours + ':' + minutes;
  }

  getFormattedDifferenceDurationOf(
    since: Date | firebase.firestore.Timestamp,
    until: Date | firebase.firestore.Timestamp
  ): string {
    if (!since || !until) return;
    if (since instanceof firebase.firestore.Timestamp)
      since = since.toDate() as Date;
    if (until instanceof firebase.firestore.Timestamp)
      until = until.toDate() as Date;

    until.setSeconds(0);
    until.setMilliseconds(0);
    since.setSeconds(0);
    since.setMilliseconds(0);

    let days = Math.max(
      Math.floor((until.getTime() - since.getTime()) / 86400000),
      0
    );

    let hours = Math.max(
      Math.floor(((until.getTime() - since.getTime()) % 86400000) / 3600000),
      0
    );

    let output = '';
    if (days) output += days + ' ' + (days == 1 ? 'Tag' : 'Tage') + ' ';
    if (hours)
      output +=
        (days ? 'und ' : '') +
        hours +
        ' ' +
        (hours == 1 ? 'Stunde' : 'Stunden') +
        ' ';

    return output.slice(0, -1);
  }
}
