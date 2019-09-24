import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';
import { HelperService } from 'src/app/core/services/helper.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.sass']
})
export class AdminComponent implements OnInit {
  constructor(
    private seo: SeoService,
    private route: ActivatedRoute,
    public helper: HelperService,
    public auth: AuthService
  ) {
    let title = this.route.snapshot.data['title'];
    this.seo.generateTags({
      title: title,
      description:
        'Mit dem Administrations Bereich hast du die Aktivität deiner Klasse immer im Blick und kannst ggf. eingreifen.',
      keywords: 'Administration, Schulplaner, FHG Online, FHG',
      robots: 'noindex, nofollow'
    });
  }

  ngOnInit() {}
}
