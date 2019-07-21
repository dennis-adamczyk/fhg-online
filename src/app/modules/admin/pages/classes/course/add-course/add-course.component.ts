import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.sass']
})
export class AddCourseComponent implements OnInit {
  courseForm: FormGroup;

  constructor(
    private fb: FormBuilder,
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
    }
    this.init();
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      if (typeof this.scrollListener == 'function') this.scrollListener();
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }

  /* ##### LOAD DATA ##### */

  init() {
    this.courseForm = this.fb.group({
      subject: ['', [Validators.required]],
      short: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[^\s]+$/),
          Validators.maxLength(5)
        ]
      ],
      room: ['', [Validators.required, Validators.maxLength(5)]],
      class: [[], [Validators.required]],
      multi: [false],
      teacher: this.fb.group({
        title: ['', [Validators.required, Validators.maxLength(10)]],
        last_name: [
          '',
          [
            Validators.required,
            Validators.pattern(
              /^([a-zA-ZÄäÖöÜüÉÈéèÇçß]+-?[a-zA-ZÄäÖöÜüÉÈéèÇçß]+\s?)+$/
            )
          ]
        ],
        short: [
          '',
          [
            Validators.required,
            Validators.pattern(/^[^\s]+$/),
            Validators.maxLength(5)
          ]
        ]
      }),
      lessons: [[]]
    });
  }
}
