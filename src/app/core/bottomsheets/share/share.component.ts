import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import {
  MatBottomSheetRef,
  MAT_BOTTOM_SHEET_DATA,
  MatSnackBar
} from '@angular/material';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.sass']
})
export class ShareSheet {
  shareTypes = ['whatsapp', 'iserv', 'email', 'link'];
  shareDetails = {
    whatsapp: {
      text: 'WhatsApp',
      icon: `whatsapp`,
      customIcon: true
    },
    iserv: {
      text: 'IServ',
      icon: `iserv`,
      customIcon: true
    },
    email: {
      text: 'E-Mail',
      icon: 'email'
    },
    link: {
      text: 'Link kopieren',
      icon: 'link'
    }
  };

  constructor(
    private snackBar: MatSnackBar,
    private bottomSheetRef: MatBottomSheetRef<ShareSheet>,
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: { url: string },
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  shareVia(type: 'whatsapp' | 'iserv' | 'email' | 'link') {
    if (!isPlatformBrowser(this.platformId)) return;
    let win: Window;
    switch (type) {
      case 'whatsapp':
        win = window.open(
          `https://wa.me/?text=${encodeURI(this.data.url)}`,
          '_blank'
        );
        break;

      case 'iserv':
        win = window.open(
          `https://franz-haniel-gymnasium.eu/iserv/mail/compose?text=${encodeURI(
            this.data.url
          )}`,
          '_blank'
        );
        break;

      case 'email':
        win = window.open(
          `mailto:empfaenger@domain.de?body=${encodeURI(this.data.url)}`,
          '_blank'
        );
        break;

      case 'link':
        if (navigator.clipboard) {
          navigator.clipboard.writeText(this.data.url).then(() => {
            this.snackBar.open(
              'Link zur Hausaufgabe in Zwischenablage kopiert',
              null,
              { duration: 4000 }
            );
          });
        } else {
          let textArea = document.createElement('textarea');
          textArea.value = this.data.url;
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();

          try {
            let successful = document.execCommand('copy');
            if (successful)
              this.snackBar.open(
                'Link zur Hausaufgabe in Zwischenablage kopiert',
                null,
                { duration: 4000 }
              );
          } catch (error) {
            console.error(error);
          }
          document.body.removeChild(textArea);
        }
        break;
    }
    if (win) win.focus();
    this.bottomSheetRef.dismiss();
  }
}
