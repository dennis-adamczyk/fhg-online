import { Component, OnInit } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.sass']
})
export class NotFoundComponent implements OnInit {
  constructor(private seo: SeoService, private route: ActivatedRoute) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Fehler 404. Es scheint, als würdest du eine ungültige Seite verlinken. Bitte überprüfe den Link, um Missverständnisse zu vermeiden.',
      keywords: '404, Nicht gefunden, FHG Online, FHG'
    });
  }

  ngOnInit() {}
}
