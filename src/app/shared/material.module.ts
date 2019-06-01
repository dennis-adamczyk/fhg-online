import { NgModule } from '@angular/core';
import {
  MatToolbarModule,
  MatButtonModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatBadgeModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatChipsModule,
  MatProgressSpinnerModule
} from '@angular/material';

const materialComponents = [
  MatToolbarModule,
  MatButtonModule,
  MatSidenavModule,
  MatIconModule,
  MatListModule,
  MatBadgeModule,
  MatInputModule,
  MatSelectModule,
  MatCheckboxModule,
  MatChipsModule,
  MatProgressSpinnerModule
];

@NgModule({
  imports: materialComponents,
  exports: materialComponents
})
export class MaterialModule {}
