import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatSnackBar, MatDialog } from '@angular/material';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import Quill from 'quill';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';
import { take } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.sass']
})
export class HelpArticleComponent implements OnInit {
  articleId = this.route.snapshot.params['article'];
  articleForm: FormGroup;
  data: any;
  loading = true;
  edited = false;
  sub: Subscription;

  modules = {
    toolbar: {
      container: [
        ['undo', 'redo'],
        ['bold', 'italic', 'undeline'],
        ['link', 'image'],
        [
          { align: '' },
          { align: 'center' },
          { align: 'right' },
          { align: 'justify' }
        ],
        [
          { list: 'unordered' },
          { list: 'bullet' },
          { indent: '+1' },
          { indent: '-1' }
        ],
        ['clear']
      ],
      handlers: {
        undo: this.onUndo,
        redo: this.onRedo
      }
    },
    clipboard: {
      matchVisual: false
    }
  };
  editor;

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean | object {
    return this.edited
      ? {
          title: 'Änderungen verwerfen?',
          content:
            'Bist du sicher, dass du die Änderungen an dem Hilfe-Artikel verwerfen willst?',
          accept: 'Verwerfen'
        }
      : true;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private db: FirestoreService,
    public helper: HelperService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

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
    if (this.sub) this.sub.unsubscribe();
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    if (this.articleId == 'add') {
      this.edited = false;
      this.loading = false;
      if (this.editor) this.editor.history.clear();
    } else if (this.sub) this.sub.unsubscribe();
    this.sub = this.db.doc$(`help/${this.articleId}`).subscribe((data: any) => {
      if (!data) {
        this.edited = false;
        this.snackBar.open('Kein Hilfe-Artikel mit dieser ID gefunden', null, {
          duration: 4000
        });
        this.router.navigate(['/admin/help']);
        return;
      }
      data = {
        title: data.title,
        content: data.content
      };
      if (JSON.stringify(data) == JSON.stringify(this.data)) return;
      if (this.loading) {
        this.data = data;
        this.articleForm.patchValue(data);
        this.edited = false;
        this.loading = false;
        if (!this.articleForm.dirty && this.editor) this.editor.history.clear();
      } else {
        this.dialog
          .open(AcceptCancelDialog, {
            data: {
              title: 'Neue Änderung',
              content:
                'An dem aktuellen Hilfe-Artikel wurde von einem anderen Guard eine Änderung vorgenommen. Möchtest du die neue Änderung übernehmen (und deine Änderungen verwerfen)?',
              accept: 'Ja'
            }
          })
          .afterClosed()
          .pipe(take(1))
          .subscribe(accept => {
            if (!accept)
              return this.snackBar.open(
                'Achtung! Mit dem Speichern des Artikels werden fremde Änderungen überschrieben.',
                null,
                { duration: 4000 }
              );

            this.articleForm.patchValue(data);
            this.edited = false;
          });
      }
    });

    this.articleForm = this.fb.group({
      title: ['', [Validators.required]],
      content: ['', [Validators.required]]
    });
    this.articleForm.valueChanges.subscribe(() => (this.edited = true));

    this.loadIcons();
  }

  loadIcons() {
    if (!isPlatformBrowser(this.platformId)) return;
    var icons = Quill.import('ui/icons');
    icons['header'][3] = `<svg viewBox="0 0 18 18">
      <path class="ql-fill" d="M16.65186,12.30664a2.6742,2.6742,0,0,1-2.915,2.68457,3.96592,3.96592,0,0,1-2.25537-.6709.56007.56007,0,0,1-.13232-.83594L11.64648,13c.209-.34082.48389-.36328.82471-.1543a2.32654,2.32654,0,0,0,1.12256.33008c.71484,0,1.12207-.35156,1.12207-.78125,0-.61523-.61621-.86816-1.46338-.86816H13.2085a.65159.65159,0,0,1-.68213-.41895l-.05518-.10937a.67114.67114,0,0,1,.14307-.78125l.71533-.86914a8.55289,8.55289,0,0,1,.68213-.7373V8.58887a3.93913,3.93913,0,0,1-.748.05469H11.9873a.54085.54085,0,0,1-.605-.60547V7.59863a.54085.54085,0,0,1,.605-.60547h3.75146a.53773.53773,0,0,1,.60547.59375v.17676a1.03723,1.03723,0,0,1-.27539.748L14.74854,10.0293A2.31132,2.31132,0,0,1,16.65186,12.30664ZM9,3A.99974.99974,0,0,0,8,4V8H3V4A1,1,0,0,0,1,4V14a1,1,0,0,0,2,0V10H8v4a1,1,0,0,0,2,0V4A.99974.99974,0,0,0,9,3Z"/>
    </svg>`;

    icons['bold'] =
      '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_bold</mat-icon>';
    icons['italic'] =
      '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_italic</mat-icon>';
    icons['underline'] =
      '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_underline</mat-icon>';

    icons['link'] =
      '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">link</mat-icon>';
    icons['image'] =
      '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">image</mat-icon>';

    icons['align'] = {
      '':
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_align_left</mat-icon>',
      center:
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_align_center</mat-icon>',
      right:
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_align_right</mat-icon>',
      justify:
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_align_justify</mat-icon>'
    };

    icons['list'] = {
      ordered:
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_list_numbered</mat-icon>',
      bullet:
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_list_bulleted</mat-icon>'
    };
    icons['indent'] = {
      '+1':
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_indent_increase</mat-icon>',
      '-1':
        '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_indent_decrease</mat-icon>'
    };

    icons['clean'] =
      '<mat-icon class="mat-icon material-icons mat-icon-no-color" role="img" aria-hidden="true">format_clear</mat-icon>';
  }

  /* ##### TRIGGERS ##### */

  onSave() {
    if (
      this.articleForm.invalid ||
      (this.editor && this.editor.getLength() <= 1)
    )
      return this.dialog.open(AcceptCancelDialog, {
        data: {
          title: 'Ungültige Eingaben',
          content:
            'Bitte gebe sowohl im Titel als auch im Inhalt des Artikels einen gültigen Text ein.',
          accept: 'Korrigieren'
        }
      });

    this.data = this.articleForm.value;

    if (this.articleId == 'add')
      this.db
        .add('help', this.articleForm.value)
        .then(doc => {
          this.edited = false;
          this.articleId = doc.id;
          this.snackBar.open('Artikel erstellt', null, { duration: 4000 });
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
            .subscribe(() => this.onSave())
        );
    else
      this.db
        .update(`help/${this.articleId}`, this.articleForm.value)
        .then(() => {
          this.edited = false;
          this.snackBar.open('Artikel gespeichert', null, { duration: 4000 });
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
            .subscribe(() => this.onSave())
        );
  }

  onDelete() {
    if (this.articleId == 'add') {
      this.router.navigate(['/admin/help']);
      return;
    }

    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: 'Hilfe-Artikel löschen?',
          content: `Soll der Hilfe-Artikel "${
            this.articleForm.get('title').value
          }" #${this.articleId} unwiderruflich gelöscht werden?`,
          accept: 'Unwiderruflich löschen',
          defaultCancel: true
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(accept => {
        if (!accept) return;
        this.db
          .delete(`help/${this.articleId}`)
          .then(() => {
            this.edited = false;
            this.snackBar.open('Artikel wird gelöscht...', null);
            this.router.navigate(['/admin/help']);
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

  onUndo() {
    this.editor.history.undo();
  }

  onRedo() {
    this.editor.history.redo();
  }
}
