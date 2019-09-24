import { Injectable, Inject, Injector, PLATFORM_ID } from '@angular/core';
import {
  Meta,
  Title,
  makeStateKey,
  TransferState
} from '@angular/platform-browser';
import {
  DOCUMENT,
  Location,
  isPlatformBrowser,
  isPlatformServer
} from '@angular/common';
import { AppToolbarService } from './app-toolbar.service';
import { take, filter, map } from 'rxjs/operators';
import { constant } from 'src/configs/constants';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

const TAGS_KEY = makeStateKey('tags');

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private overwritten = false;

  constructor(
    private meta: Meta,
    private titleService: Title,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private injector: Injector,
    private state: TransferState,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    const server_tags = this.state.get(TAGS_KEY, null as any);
    if (server_tags) this.generateTags(server_tags);
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => this.route.snapshot),
        map(route => {
          while (route.firstChild) {
            route = route.firstChild;
          }
          return route;
        })
      )
      .subscribe(route => {
        if (!this.overwritten && route && route.data && route.data.title)
          this.generateTags({ title: route.data.title });
        this.overwritten = false;
      });
  }

  generateTags(tags: {
    title?: string;
    description?: string;
    image?: string;
    keywords?: string;
    robots?: string;
  }) {
    tags = {
      title: '',
      description: 'Dein Online Schulplaner',
      image: 'https://beta.fhg-online.de/assets/icons/icon-512x512.png',
      keywords: '',
      robots: document.location.hostname.endsWith('.de')
        ? 'noindex, nofollow' //TODO: Change to 'index, follow'
        : 'noindex, nofollow',
      ...tags
    };

    const site_name = 'FHG Online';

    let url = 'https://beta.fhg-online.de';
    url += this.location.path();

    if (tags.title && tags.title.length)
      if (!tags.title.endsWith(constant.titleSuffix))
        tags.title = tags.title + constant.titleSuffix;
      else tags.title = tags.title;
    else tags.title = site_name;
    this.titleService.setTitle(tags.title);

    this.meta.updateTag({ name: 'description', content: tags.description });
    this.meta.updateTag({ name: 'keywords', content: tags.keywords });
    this.meta.updateTag({ name: 'robots', content: tags.robots });

    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: site_name });
    this.meta.updateTag({ property: 'og:title', content: tags.title });
    this.meta.updateTag({
      property: 'og:description',
      content: tags.description
    });
    this.meta.updateTag({ property: 'og:image', content: tags.image });
    this.meta.updateTag({
      property: 'og:url',
      content: url
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:creator', content: '@fhgonline' });
    this.meta.updateTag({ name: 'twitter:site', content: '@fhgonline' });
    this.meta.updateTag({ name: 'twitter:title', content: tags.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: tags.description
    });
    this.meta.updateTag({ name: 'twitter:image', content: tags.image });

    this.state.set(TAGS_KEY, tags as any);
    this.overwritten = true;
  }
}
