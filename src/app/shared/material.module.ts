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
  MatCardModule,
  MatSlideToggleModule,
  MatDialogModule,
  MatSnackBarModule,
  MatTabsModule,
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,
  MatTooltipModule,
  MatTreeModule,
  MatExpansionModule,
  MatDatepickerModule,
  MatNativeDateModule
} from '@angular/material';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkTreeModule } from '@angular/cdk/tree';

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
  MatCardModule,
  MatSlideToggleModule,
  MatDialogModule,
  MatSnackBarModule,
  MatTabsModule,
  MatTableModule,
  MatSortModule,
  MatPaginatorModule,
  MatTooltipModule,
  MatTreeModule,
  CdkTreeModule,
  MatExpansionModule,
  MatDatepickerModule,
  MatNativeDateModule
];

@NgModule({
  imports: materialComponents,
  exports: materialComponents
})
export class MaterialModule {}
