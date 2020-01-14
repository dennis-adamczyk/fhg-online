import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
  ViewChild
} from "@angular/core";
import { isPlatformBrowser, Location } from "@angular/common";
import {
  MatSort,
  MatTableDataSource,
  MatPaginator,
  MatDialog
} from "@angular/material";
import { SelectionModel } from "@angular/cdk/collections";
import { AngularFireFunctions } from "@angular/fire/functions";
import { AcceptCancelDialog } from "src/app/core/dialogs/accept-cancel/accept-cancel.component";
import { take, filter, tap } from "rxjs/operators";
import { NavigationEnd, Router, ActivatedRoute } from "@angular/router";
import { message } from "src/configs/messages";
import { userInfo } from "os";
import { registerUser } from "functions/src";
import { SeoService } from "src/app/core/services/seo.service";
import { HelperService } from "src/app/core/services/helper.service";
import { Firestore } from "@google-cloud/firestore";
import { FirestoreService } from "src/app/core/services/firestore.service";
import {
  FormBuilder,
  Validators,
  FormGroup,
  FormControl
} from "@angular/forms";
import { constant } from "src/configs/constants";

interface Teacher {
  uid: string;
  name: {
    title: string;
    first_name: string;
    last_name: string;
  };
  email: string;
  registered: boolean;
  subjects: {
    [subject: string]: boolean;
  };
  user: any;
  created_at?: Date;
  updated_at?: Date;
}

interface TeacherShort {
  uid: string;
  name: {
    title: string;
    first_name: string;
    last_name: string;
  };
  registered: boolean;
  subjects: {
    [subject: string]: boolean;
  };
}

@Component({
  selector: "app-teachers",
  templateUrl: "./teachers.component.html",
  styleUrls: ["./teachers.component.sass"]
})
export class TeachersComponent implements OnInit {
  constant = constant;

  isLoading = true;
  search = false;

  offline = false;

  titles = constant.nameTitles;

  teacherList: TeacherShort[];
  teacherForms: { [uid: string]: FormGroup } = {};
  teacherData: { [uid: string]: Teacher } = {};

  constructor(
    private helper: HelperService,
    private seo: SeoService,
    private db: FirestoreService,
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data["title"];
    this.seo.generateTags({
      title: title,
      description:
        "Überblicke alle Lehrer*innen, die im System registriert und verfügbar sind.",
      keywords:
        "Administration, Benutzer, Lehrer, Schulplaner, FHG Online, FHG",
      robots: "noindex, nofollow"
    });
  }

  /* ##### Toolbar Extention ##### */

  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;
  scrollListener: any;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector(".main-toolbar");
      this.sidenavContent = document.querySelector("mat-sidenav-content");
      this.toolbarExtention = document.querySelector(".toolbar-extention");
      let scrollHandler = () => {
        if (
          this.sidenavContent.scrollTop >
          this.toolbarExtention.clientHeight - this.toolbar.clientHeight
        ) {
          this.renderer.removeStyle(this.toolbar, "box-shadow");
        } else {
          this.renderer.setStyle(this.toolbar, "box-shadow", "none");
        }
      };
      scrollHandler();
      this.scrollListener = this.renderer.listen(
        this.sidenavContent,
        "scroll",
        event => scrollHandler()
      );
    }

    this.loadData();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, "box-shadow");
    }
  }

  /* ##### LOAD DATA ##### */

  loadData() {
    this.db
      .doc$("users/--index--/teachers/--index--")
      .pipe(
        tap((d: { teachers: TeacherShort[] }) => {
          if (!d && !this.helper.onLine) {
            this.offline = true;
            return;
          }
          this.offline = false;
          this.isLoading = false;
          this.teacherList = d.teachers.sort((a, b) => {
            return a.name.last_name === b.name.last_name
              ? 0
              : a.name.last_name > b.name.last_name
              ? 1
              : -1;
          });
        })
      )
      .subscribe();
  }

  /* ##### TRIGGERS ##### */

  modeChange(event) {
    if (event.value != "users") return;
    this.router.navigate(["/admin/users"]);
  }

  /* ###### HELPER ##### */

  getTeacherForm(uid: string) {
    if (!this.teacherForms[uid]) {
      this.db
        .doc$(`users/--index--/teachers/${uid}`)
        .subscribe((teacher: Teacher) => {
          if (!this.teacherForms[uid])
            this.teacherForms[uid] = this.fb.group({
              name: this.fb.group({
                title: ["", [Validators.required]],
                first_name: [
                  "",
                  [
                    Validators.required,
                    Validators.pattern(
                      /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
                    )
                  ]
                ],
                last_name: [
                  "",
                  [
                    Validators.required,
                    Validators.pattern(
                      /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
                    )
                  ]
                ]
              }),
              email: [
                "",
                [
                  Validators.required,
                  Validators.minLength(3),
                  Validators.pattern(/^([a-zA-Z-]+\.[a-zA-Z-]+)+$/)
                ]
              ],
              subjects: [[]]
            });
          this.teacherForms[uid].setValue({
            name: teacher.name,
            email: teacher.email.split("@")[0],
            subjects: teacher.subjects
          });
          this.teacherData[uid] = teacher;
        });
    }
    return this.teacherForms[uid];
  }

  getErrorMessage(prop: string, controll: FormControl): string {
    return message.errors.admin.teachers[prop][Object.keys(controll.errors)[0]];
  }
}
