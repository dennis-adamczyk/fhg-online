import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID,
  HostListener
} from '@angular/core';
import { isPlatformBrowser, Location } from '@angular/common';
import { SeoService } from 'src/app/core/services/seo.service';
import { FirestoreService } from 'src/app/core/services/firestore.service';
import { Title } from '@angular/platform-browser';
import { MatBottomSheet, MatSnackBar } from '@angular/material';
import { HelperService } from 'src/app/core/services/helper.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-request',
  templateUrl: './request.component.html',
  styleUrls: ['./request.component.sass']
})
export class RequestComponent implements OnInit {
  title = this.route.snapshot.data['title'];
  type: 'bug' | 'feedback' | 'question' = this.route.snapshot.data['type'];
  requestForm: FormGroup;
  loading: boolean = false;
  submitted: boolean = false;

  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  constructor(
    private seo: SeoService,
    private db: FirestoreService,
    private auth: AuthService,
    private fb: FormBuilder,
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
      this.toolbar = document.querySelector('.request mat-toolbar');
      this.sidenavContent = document.querySelector('.request .container');
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
      this.loadData();
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (this.scrollListener) this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean | object {
    return !this.submitted && this.requestForm.dirty
      ? {
          title: 'Änderungen verwerfen?',
          content: 'Bist du sicher, dass du die Anfrage verwerfen willst?',
          accept: 'Verwerfen'
        }
      : true;
  }

  /* ===== LOADING DATA ===== */

  loadData() {
    let controlConfig: any = {
      email: ['', [Validators.required, Validators.email]],
      message: ['', [Validators.required, Validators.minLength(10)]],
      screenshot: [[]]
    };
    if (this.type == 'bug')
      controlConfig.protocol = [true, [Validators.required]];
    this.requestForm = this.fb.group(controlConfig);
    this.requestForm.get('email').setValue(this.auth.user.email);
  }

  /* ===== GETTER ===== */

  get screenshots() {
    return this.requestForm.get('screenshot');
  }

  /* ===== TRIGGERS ===== */

  openFileBrowser() {
    let element: HTMLElement = document.getElementById('screenshotUpload');
    element.click();
  }

  addScreenshot(event: any) {
    const files = event.target.files;

    if (files) {
      for (const i in files) {
        if (files.hasOwnProperty(i)) {
          const file = files[i];

          const reader = new FileReader();
          reader.onload = this._handleReaderLoaded.bind(this);
          reader.readAsBinaryString(file);
        }
      }
    }
  }

  private _handleReaderLoaded(e) {
    let screenshots = this.screenshots.value;
    screenshots.push('data:image/png;base64,' + btoa(e.target.result));
    this.screenshots.setValue(screenshots);
  }

  deleteScreenshot(index: number) {
    let screenshots = this.screenshots.value as string[];
    screenshots = screenshots.filter((v, i) => i != index);
    this.screenshots.setValue(screenshots);
  }

  navigateBack() {
    if (!isPlatformBrowser(this.platformId)) return;
    if (
      document.referrer.indexOf(window.location.host) != -1 &&
      document.referrer != window.location.href
    )
      this.location.back();
    else this.router.navigate(['/help']);
  }

  onSubmit() {
    if (this.requestForm.invalid) return;
    this.loading = true;

    let data: any = {};

    data.type = this.type;
    data.by = {
      id: this.auth.user.id,
      name: this.auth.user.name,
      roles: this.auth.user.roles,
      email: this.requestForm.value.email
    };
    data.message = this.requestForm.value.message;
    if (this.type == 'bug' && this.requestForm.get('protocol').value) {
      data.protocol = {};
      data.protocol.user = localStorage.getItem('user');
      data.protocol.settings = localStorage.getItem('settings');
      data.protocol.course_names = localStorage.getItem('course_names');
      data.protocol.homework = localStorage.getItem('homework');
      data.protocol.timetable = localStorage.getItem('timetable');
    }
    data.agent = {
      browser: this.helper.getBrowserName(),
      cookies: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      header: navigator.userAgent
    };
    data.screenshot = this.requestForm.value.screenshot;

    if (new Blob([JSON.stringify(data)]).size >= 1e6) {
      this.snackBar.open(
        'Die Daten sind zu groß (> 1 MB). Bitte lösche ggf. Screenshots.',
        null,
        { duration: 4000 }
      );
      this.loading = false;
      return;
    }

    this.db.add('requests', data).then(doc => {
      this.loading = false;
      this.submitted = true;
      this.requestForm.markAsPending();
    });
  }
}
