import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from "@angular/core";
import { HelperService } from "src/app/core/services/helper.service";
import { SeoService } from "src/app/core/services/seo.service";
import { FirestoreService } from "src/app/core/services/firestore.service";
import { FormBuilder } from "@angular/forms";
import { Router } from "express";
import { ActivatedRoute } from "@angular/router";
import { MatDialog } from "@angular/material";
import { isPlatformBrowser } from "@angular/common";
import { tap } from "rxjs/operators";

interface Subject {
  name: {
    short: string;
    normal: string;
    long: string;
  };
  color: string;
  aliases: string[];
}

@Component({
  selector: "app-subjects",
  templateUrl: "./subjects.component.html",
  styleUrls: ["./subjects.component.sass"]
})
export class SubjectsComponent implements OnInit {
  isLoading = false;
  search = false;

  offline = false;

  subjects: Subject[];

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
        "Überblicke alle Fächer, die im System registriert und verfügbar sind.",
      keywords: "Administration, Fächer, Fach, Schulplaner, FHG Online, FHG",
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
      .doc$("config/subjects")
      .pipe(
        tap((d: { subjects: Subject[] }) => {
          if (!d && !this.helper.onLine) {
            this.offline = true;
            return;
          }
          this.offline = false;
          this.subjects = d.subjects.sort((a, b) => {
            return a.name.normal === b.name.normal
              ? 0
              : a.name.normal > b.name.normal
              ? 1
              : -1;
          });
        })
      )
      .subscribe();
  }
}
