import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SeoService } from 'src/app/core/services/seo.service';
import { HelperService } from 'src/app/core/services/helper.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.sass']
})
export class StartComponent implements OnInit {
  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    public helper: HelperService,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Die Online Schulplaner Web App des Franz-Haniel-Gymnasiums erleichtert die Organisation des Schulalltags von Schülern und Lehrern.',
      keywords:
        'FHG Online, FHG, Franz-Haniel-Gymnasium, Schulplaner, App, Web App'
    });
  }

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
