import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { environment } from 'src/environments/environment.prod';
import { isPlatformBrowser } from '@angular/common';

declare var gtag: Function;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  public event(eventName: string, params: {}) {
    gtag('event', eventName, params);
  }

  public init() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.listenForRouteChanges();

    try {
      const script1 = document.createElement('script');
      script1.async = true;
      script1.src =
        'https://www.googletagmanager.com/gtag/js?id=' +
        environment.googleAnalyticsKey;
      document.head.appendChild(script1);

      const script2 = document.createElement('script');
      script2.innerHTML =
        `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '` +
        environment.googleAnalyticsKey +
        `', {'send_page_view': false});
      `;
      document.head.appendChild(script2);
    } catch (ex) {
      console.error('Error appending google analytics');
      console.error(ex);
    }
  }

  private listenForRouteChanges() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        gtag('config', environment.firebase, {
          page_path: event.urlAfterRedirects
        });
      }
    });
  }
}
