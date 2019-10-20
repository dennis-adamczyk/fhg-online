import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { MatSnackBar, MatBottomSheet } from '@angular/material';

@Component({
  selector: 'app-article',
  templateUrl: './article.component.html',
  styleUrls: ['./article.component.sass']
})
export class HelpArticleComponent implements OnInit {
  articleId = this.route.snapshot.params['article'];
  data: any;
  loading = true;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  constructor(
    private seo: SeoService,
    private db: FirestoreService,
    private title: Title,
    private bottomSheet: MatBottomSheet,
    private helper: HelperService,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute,
    public location: Location,
    private router: Router,
    private renderer: Renderer2,
    private breakpointObserver: BreakpointObserver,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ===== TOOLBAR ===== */

  toolbar: Element;
  sidenavContent: Element;
  scrollListener: any;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.help mat-toolbar');
      this.sidenavContent = document.querySelector('.help .container');
      let scrollHandler = () => {
        if (this.sidenavContent.scrollTop > 0) {
          this.renderer.removeStyle(this.toolbar, 'background-color');
          this.renderer.removeStyle(this.toolbar, 'border-bottom');
        } else {
          this.renderer.setStyle(
            this.toolbar,
            'background-color',
            'transparent'
          );
          this.renderer.setStyle(this.toolbar, 'border-bottom', 'none');
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

  /* ===== LOAD DATA ===== */

  loadData() {
    this.db.doc$(`help/${this.articleId}`).subscribe((data: any) => {
      if (!data) {
        this.snackBar.open('Kein Hilfe-Artikel mit dieser ID gefunden', null, {
          duration: 4000
        });
        this.navigateBack();
        return;
      }
      data = {
        title: data.title,
        content: data.content
      };
      this.loading = false;
      this.data = data;
      this.seo.generateTags({
        title: data.title + ' ◃ Hilfe',
        description:
          this.helper.shorten(this.helper.htmlToText(data.content), 150) +
          '...',
        keywords:
          'Hilfe, Fragen, Antwort, Warum, Wie, Schulplaner, FHG Online, FHG'
      });
    });
  }

  /* ===== TRIGGERS ===== */

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (
      document.referrer.indexOf(window.location.host) != -1 &&
      document.referrer != window.location.href
    )
      this.location.back();
    else this.router.navigate(['/help'], { replaceUrl: true });
  }

  onShare() {
    if (!isPlatformBrowser(this.platformId)) return;
    let title = this.title.getTitle();
    let url = window.location.href;
    if (navigator['share']) {
      navigator['share']({
        title: title,
        url: url
      });
    } else {
      this.bottomSheet.open(ShareSheet, {
        data: { url: url },
        panelClass: 'fullWithSheet'
      });
    }
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml, Title } from '@angular/platform-browser';
import { HelperService } from 'src/app/core/services/helper.service';
import { ShareSheet } from 'src/app/core/bottomsheets/share/share.component';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({ name: 'noSanitize' })
export class NoSanitizePipe implements PipeTransform {
  constructor(private domSanitizer: DomSanitizer) {}
  transform(html: string): SafeHtml {
    return this.domSanitizer.bypassSecurityTrustHtml(html);
  }
}
