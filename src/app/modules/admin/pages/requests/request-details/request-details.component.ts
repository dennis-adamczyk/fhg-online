import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatDialog } from '@angular/material';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { Lightbox } from 'ngx-lightbox';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { adminRequestsKey } from '../requests.component';

@Component({
  selector: 'app-request-details',
  templateUrl: './request-details.component.html',
  styleUrls: ['./request-details.component.sass']
})
export class RequestDetailsComponent implements OnInit {
  requestId = this.route.snapshot.params['requestId'];
  request: any;

  temp = {
    open_protocol: {}
  };

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private lightbox: Lightbox,
    public auth: AuthService,
    private dialog: MatDialog,
    private db: FirestoreService,
    public helper: HelperService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Verwallte alle Anfragen, die im Hilfe Center gemeldet werden.',
      keywords: 'Administration, Meldungen, Schulplaner, FHG Online, FHG',
      robots: 'noindex, nofollow'
    });
  }

  /* ##### Toolbar Extention ##### */

  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.toolbarExtention = document.querySelector('.toolbar-extention');
      let scrollHandler = () => {
        if (
          this.sidenavContent.scrollTop >
          this.toolbarExtention.clientHeight - this.toolbar.clientHeight
        ) {
          this.renderer.removeStyle(this.toolbar, 'box-shadow');
        } else {
          this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
        }
      };
      scrollHandler();
      this.scrollListener = this.renderer.listen(
        this.sidenavContent,
        'scroll',
        event => scrollHandler()
      );

      this.loadData();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ===== LOAD DATA ===== */

  loadData() {
    this.db.doc$(`requests/${this.requestId}`).subscribe(data => {
      if (!data) {
        this.snackBar.open('Keine Meldung mit dieser ID gefunden', null, {
          duration: 4000
        });
        this.router.navigate(['/admin/requests']);
        return;
      }
      this.request = data;
      if (!this.hasSeen(this.requestId)) {
        let storage: string[] = JSON.parse(
          localStorage.getItem(adminRequestsKey)
        );
        storage.push(this.requestId);
        localStorage.setItem(adminRequestsKey, JSON.stringify(storage));
        this.db.update(`users/${this.auth.user.id}`, {
          newAdminRequest: false
        });
      }
    });
  }

  /* ===== TRIGGERS ===== */

  openScreenshot(index: number) {
    var w = window.open('', '_blank');
    w.document.title = 'Screenshot ' + (index + 1);

    let setContents = () => {
      let meta = w.document.head.appendChild(w.document.createElement('meta'));
      meta.name = 'viewport';
      meta.content = 'width=device-width, minimum-scale=0.1';
      let img = w.document.body.appendChild(w.document.createElement('img'));
      img.src = this.request.screenshot[index];
      img.style.display = 'block';
      img.style.margin = '0 auto';
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      w.document.body.style.margin = '0';
      w.document.body.style.padding = '0';
      w.document.body.style.backgroundColor = '#0e0e0e';
      w.document.body.style.display = 'flex';
      w.document.body.style.alignItems = 'center';
      w.document.body.style.width = '100%';
      w.document.body.style.height = '100%';
    };

    setContents();

    setTimeout(() => setContents, 0);
    return;
    this.lightbox.open(
      this.request.screenshot.map(screenshot => {
        return {
          src: screenshot,
          caption: '',
          thumb: screenshot
        };
      }),
      index
    );
  }

  onDelete() {
    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Meldung löschen?',
          content: `Soll ${
            this.request.type == 'bug'
              ? 'die Fehlermeldung'
              : this.request.type == 'feedback'
              ? 'das Feedback'
              : this.request.type == 'question'
              ? 'der Hilfe-Vorschlag'
              : ''
          } #${
            this.requestId
          } unwiderruflich gelöscht werden? Das kann ein paar Sekunden dauern.`,
          accept: 'Unwiderruflich löschen',
          defaultCancel: true
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(accept => {
        if (!accept) return;
        this.db
          .delete(`requests/${this.requestId}`)
          .then(() => {
            this.snackBar.open('Meldung wird gelöscht...', null);
            this.router.navigate(['/admin/requests']);
          })
          .catch(error =>
            this.snackBar
              .open(
                `Fehler aufgetreten (${error.code}: ${error.message})`,
                'Erneut versuchen',
                { duration: 4000 }
              )
              .onAction()
              .pipe(take(1))
              .subscribe(() => this.onDelete())
          );
      });
  }

  /* ===== HELPER ===== */

  getReplyUrl(): string {
    if (!this.request) return;
    let output = 'mailto:';
    output += this.request.by.email;
    output +=
      '?subject=' +
      encodeURI(
        (this.request.type == 'bug'
          ? 'Fehlermeldung'
          : this.request.type == 'feedback'
          ? 'Feedback'
          : this.request.type == 'question'
          ? 'Hilfe-Vorschlag'
          : '') + ' ◂ FHG Online'
      );
    output +=
      '&body=' +
      encodeURI(
        `Liebe/r ${this.request.by.name.first_name} ${
          this.request.by.name.last_name
        },




Mit freundlichen Grüßen
VORNAME NACHNAME
für das FHG Online Entwicklerteam

-----
DEINE ANFRAGE:

Gesendet: ${this.helper
          .getDateOf(this.request.created_at)
          .toLocaleDateString()}, ${this.helper
          .getDateOf(this.request.created_at)
          .toLocaleTimeString()} Uhr
Von: ${this.request.by.name.first_name} ${this.request.by.name.last_name} (${
          this.request.by.email
        })
ID: ${this.requestId}
Screenshots: ${this.request.screenshot.length}

${this.request.message}
`
      );
    return output;
  }

  getJSON(jsonStr: string) {
    let json = JSON.parse(jsonStr);
    if (typeof json != 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function(match) {
        var cls = 'number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'key';
          } else {
            cls = 'string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'boolean';
        } else if (/null/.test(match)) {
          cls = 'null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }

  previewJSON(jsonStr: string) {
    jsonStr = JSON.stringify(JSON.parse(jsonStr)).replace(
      /\"([^(\")"]+)\":/g,
      '$1:'
    );
    return jsonStr.slice(0, 20);
  }

  hasSeen(id: string): boolean {
    if (!localStorage.getItem(adminRequestsKey)) {
      localStorage.setItem(adminRequestsKey, JSON.stringify([]));
    }
    let storage: string[] = JSON.parse(localStorage.getItem(adminRequestsKey));
    return storage.includes(id);
  }
}
