import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { HelperService } from 'src/app/core/services/helper.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { tap, take } from 'rxjs/operators';
import { isPlatformBrowser } from '@angular/common';
import { MatChipInputEvent, MatDialog, MatSnackBar } from '@angular/material';
import { ColorPickerDialog } from 'src/app/core/dialogs/color-picker/color-picker.component';
import { message } from 'src/configs/messages';
import { AcceptCancelDialog } from 'src/app/core/dialogs/accept-cancel/accept-cancel.component';

interface Subject {
  id: string;
  name: {
    short: string;
    normal: string;
    long: string;
  };
  color: string;
  aliases: string[];
  details?: {
    bilingual?: boolean;
    restricted?: {
      by: 'year' | 'sek';
      sek?: 1 | 2;
      from?: number;
      to?: number;
    };
  };
}

interface SubjectNode {
  data: Subject;
  form: FormGroup;
  editing: boolean;
  new?: boolean;
}

@Component({
  selector: 'app-subjects',
  templateUrl: './subjects.component.html',
  styleUrls: ['./subjects.component.sass']
})
export class SubjectsComponent implements OnInit {
  isLoading = false;
  search = false;

  offline = false;

  rawData: any;
  subjects: SubjectNode[] = [];

  constructor(
    private helper: HelperService,
    private seo: SeoService,
    private db: FirestoreService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Überblicke alle Fächer, die im System registriert und verfügbar sind.',
      keywords: 'Administration, Fächer, Fach, Schulplaner, FHG Online, FHG',
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
    }

    this.loadData();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.db
      .doc$('config/subjects')
      .pipe(
        tap((d: { subjects: Subject[] }) => {
          if (!d && !this.helper.onLine) {
            this.offline = true;
            return;
          }
          this.offline = false;
          this.rawData = d;
          let subjectArray = [];

          console.log(d.subjects);

          if (!d.subjects) return;
          Object.keys(d.subjects).forEach(id => {
            let data = JSON.parse(JSON.stringify(d.subjects[id])) as Subject;

            console.log(id, data);

            let existingData: SubjectNode;
            if (
              this.subjects &&
              this.subjects.filter(s => s.data.id == data.id).length
            ) {
              existingData = this.subjects.filter(s => s.data.id == data.id)[0];
            }

            let current = {
              data: { ...data, id },
              editing: existingData ? existingData.editing : false,
              form:
                existingData && existingData.editing
                  ? existingData.form
                  : this.fb.group({
                      name: this.fb.group({
                        short: [
                          '',
                          [Validators.required, Validators.maxLength(6)]
                        ],
                        normal: [
                          '',
                          [Validators.required, Validators.minLength(3)]
                        ],
                        long: [
                          '',
                          [Validators.required, Validators.minLength(3)]
                        ]
                      }),
                      color: ['', [Validators.required]],
                      aliases: [[], []]
                    })
            };
            current.form.setValue(d.subjects[id]);

            console.log(id, current);
            subjectArray.push(current);
          });

          console.log(subjectArray);
          this.subjects = subjectArray.sort((a, b) => {
            return a.data.name.normal === b.data.name.normal
              ? 0
              : a.data.name.normal > b.data.name.normal
              ? 1
              : -1;
          });
        })
      )
      .subscribe();
  }

  /* ##### TRIGGERS ##### */

  addSubject() {
    if (this.subjects.filter(s => s.new).length) return;

    let id = this.helper.generateId();

    while (this.subjects.filter(s => s.data.id == id).length) {
      id = this.helper.generateId();
    }

    let current: SubjectNode = {
      data: {
        id: id,
        aliases: [],
        color: '',
        name: {
          short: '',
          normal: '',
          long: ''
        }
      },
      editing: true,
      form: this.fb.group({
        name: this.fb.group({
          short: ['', [Validators.required, Validators.maxLength(6)]],
          normal: ['', [Validators.required, Validators.minLength(3)]],
          long: ['', [Validators.required, Validators.minLength(3)]]
        }),
        color: ['', [Validators.required]],
        aliases: [[], []]
      }),
      new: true
    };
    this.subjects = [current, ...this.subjects];
  }

  addAlias(event: MatChipInputEvent, subject: SubjectNode): void {
    const input = event.input;
    const value = event.value;

    if ((value || '').trim()) {
      subject.form.get('aliases').value.push(value.trim());
    }

    if (input) {
      input.value = '';
    }
  }

  removeAlias(alias: string, subject: SubjectNode): void {
    const aliasIndex = subject.form.get('aliases').value.indexOf(alias.trim());

    if (aliasIndex < 0) return;

    subject.form.get('aliases').value.splice(aliasIndex, 1);
  }

  changeColor(subject: SubjectNode) {
    this.dialog
      .open(ColorPickerDialog, {
        data: {
          color: subject.form.get('color').value
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        subject.form.get('color').markAsTouched();
        if (result) {
          subject.form.get('color').setValue(result);
        }
      });
  }

  onUndo(subject: SubjectNode) {
    if (subject.new) {
      const index = this.subjects.indexOf(subject);
      if (index < 0) return;
      this.subjects.splice(index, 1);
      this.snackBar.open('Fach gelöscht', null, { duration: 4000 });
    }
    subject.editing = false;
    let newValue = JSON.parse(JSON.stringify(subject.data)) as Subject;
    delete newValue.id;
    subject.form.setValue(newValue);
  }

  onDelete(subject: SubjectNode) {
    const index = this.subjects.indexOf(subject);
    if (index < 0) return;

    this.dialog
      .open(AcceptCancelDialog, {
        data: {
          title: `Fach ${subject.data.name.normal || ''} löschen?`,
          content: `Das Fach ${subject.data.name.normal ||
            ''} wird für alle Nutzer unwiderruflich gelöscht, sodass die Daten nicht mehr wiederhergestellt werden können`,
          accept: 'Unwiederruflich löschen',
          defaultCancel: true
        }
      })
      .afterClosed()
      .pipe(take(1))
      .subscribe(result => {
        if (result) {
          this.subjects.splice(index, 1);
          if (!subject.new) {
            delete this.rawData.subjects[subject.data.id];

            this.db.update('config/subjects', {
              subjects: this.rawData.subjects
            });
          }
          this.snackBar.open('Fach gelöscht', null, { duration: 4000 });
        }
      });
  }

  onSave(subject: SubjectNode) {
    if (subject.form.invalid) {
      subject.form.markAsPending();
      return;
    }

    const index = this.subjects.indexOf(subject);
    if (index < 0) return;

    let newValue = subject.form.value as Subject;

    if (newValue != subject.data) {
      this.db
        .update('config/subjects', {
          [`subjects.${subject.data.id}`]: newValue
        })
        .then(() => {
          this.snackBar.open('Fach gespeichert', null, { duration: 4000 });
        });
    }
  }

  getErrorMessage(prop: string, controll: FormControl): string {
    return message.errors.admin.subjects[prop][Object.keys(controll.errors)[0]];
  }
}
