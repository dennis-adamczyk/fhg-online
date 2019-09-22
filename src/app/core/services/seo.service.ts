import { Injectable, Inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { AppToolbarService } from './app-toolbar.service';
import { take, filter, map } from 'rxjs/operators';
import { constant } from 'src/configs/constants';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  tags;

  constructor(
    private meta: Meta,
    private titleService: Title,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(() => {
          let child = this.route.firstChild;
          while (child) {
            if (child.firstChild) {
              child = child.firstChild;
            } else if (child.snapshot.data && child.snapshot.data['title']) {
              return child.snapshot.data['title'];
            } else {
              return null;
            }
          }
          return null;
        })
      )
      .subscribe(title => {
        this.generateTags(title);
      });
  }

  generateTags(title) {
    let tags = {
      title: '',
      description: 'Dein Online Schulplaner',
      image: 'https://beta.fhg-online.de/assets/icons-icon-512x512.png',
      keywords: '',
      robots: 'noindex, nofollow', //TODO: Change to 'index, follow'
      ...this.tags
    };

    const site_name = 'FHG Online';

    if (!tags.title.length) tags.title = title + constant.titleSuffix;
    this.titleService.setTitle(tags.title);

    this.meta.updateTag({ name: 'description', content: tags.description });
    this.meta.updateTag({ name: 'keywords', content: tags.keywords });
    this.meta.updateTag({ name: 'robots', content: tags.robots });

    this.meta.updateTag({ name: 'og:title', content: tags.title });
    this.meta.updateTag({ name: 'og:image', content: tags.image });
    this.meta.updateTag({ name: 'og:type', content: 'website' });
    this.meta.updateTag({
      name: 'og:url',
      content: document.location.href
    });
    this.meta.updateTag({ name: 'og:site_name', content: site_name });
    this.meta.updateTag({
      name: 'og:bescription',
      content: tags.description
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'app' });
    this.meta.updateTag({ name: 'twitter:title', content: tags.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: tags.description
    });
    this.meta.updateTag({ name: 'twitter:image', content: tags.image });
  }
}
