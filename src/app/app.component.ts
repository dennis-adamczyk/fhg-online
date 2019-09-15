import { Component } from '@angular/core';
import { UpdateService } from './core/services/update.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {
  theme: string = 'light-theme';

  constructor(private updater: UpdateService, public auth: AuthService) {}
}
