import { Component, OnInit, Input } from '@angular/core';
import { speedDialFabAnimations } from './speed-dial-fab.animations';

@Component({
  selector: 'app-speed-dial-fab',
  templateUrl: './speed-dial-fab.component.html',
  styleUrls: ['./speed-dial-fab.component.sass'],
  animations: speedDialFabAnimations
})
export class SpeedDialFabComponent implements OnInit {
  @Input() fabButtons: { label?: string; icon: string; click: () => void }[];

  buttons = [];
  fabActive = false;

  constructor() {}

  ngOnInit() {}

  showItems() {
    this.fabActive = true;
    this.buttons = this.fabButtons;
  }

  hideItems() {
    this.fabActive = false;
    this.buttons = [];
  }

  onToggleFab() {
    this.buttons.length ? this.hideItems() : this.showItems();
  }
}
