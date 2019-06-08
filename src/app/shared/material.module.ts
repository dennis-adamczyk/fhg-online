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
  MatProgressSpinnerModule,
  MatStepperModule,
  MatRadioModule,
  MatCardModule
} from '@angular/material';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { OverlayModule } from '@angular/cdk/overlay';

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
  MatProgressSpinnerModule,
  MatStepperModule,
  CdkStepperModule,
  MatRadioModule,
  OverlayModule,
  MatCardModule
];

@NgModule({
  imports: materialComponents,
  exports: materialComponents
})
export class MaterialModule {}
