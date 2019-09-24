import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Observable } from 'rxjs';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.sass']
})
export class HelpComponent implements OnInit {
  isHandset$: Observable<boolean> = this.breakpointObserver
    .observe(Breakpoints.Handset)
    .pipe(map(result => result.matches));

  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    public location: Location,
    private breakpointObserver: BreakpointObserver
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Beim Hilfe Center von FHG Online kannst du schnell und einfach deine Fragen stellen, Feedback geben und das Entwickler Team kontaktieren.',
      keywords:
        'Hilfe, Fragen, Feedback, Kontakt, Team, Antwort, Warum, Wie, Schulplaner, FHG Online, FHG'
    });
  }

  ngOnInit() {}
}
