import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  Renderer2,
  ViewChild
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { MatTabGroup } from '@angular/material';

@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.sass']
})
export class InformationComponent implements OnInit {
  toolbar: Element;
  @ViewChild('tabs', { static: true }) tabGroup: MatTabGroup;

  constructor(
    private route: ActivatedRoute,
    private renderer: Renderer2,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.toolbar = document.querySelector('.main-toolbar');
      this.renderer.setStyle(this.toolbar, 'box-shadow', 'none');
    }
    this.route.fragment.subscribe(fragment => {
      switch (fragment) {
        case 'imprint':
          this.tabGroup.selectedIndex = 0;
          break;
        case 'privacy':
          this.tabGroup.selectedIndex = 1;
          break;
        case 'terms':
          this.tabGroup.selectedIndex = 2;
          break;
        default:
          if (!fragment) break;
          try {
            document
              .querySelector('#' + fragment)
              .scrollIntoView({ behavior: 'smooth' });
          } catch (e) {}
          break;
      }
    });
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.renderer.removeStyle(this.toolbar, 'box-shadow');
    }
  }
}
