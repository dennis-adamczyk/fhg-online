import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.sass']
})
export class StartComponent implements OnInit {
  constructor(
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  /* ##### Toolbar Extention ##### */

  toolbar: Element;
  sidenavContent: Element;
  toolbarExtention: Element;

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.sidenavContent = document.querySelector('mat-sidenav-content');
      this.toolbarExtention = document.querySelector('.toolbar-extention');
      this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }
}
