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
  MatNativeDateModule,
  MatBottomSheetModule
} from '@angular/material';
import { CdkStepperModule } from '@angular/cdk/stepper';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkTreeModule } from '@angular/cdk/tree';
import { TextFieldModule } from '@angular/cdk/text-field';
import { A11yModule } from '@angular/cdk/a11y';

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
  MatNativeDateModule,
  TextFieldModule,
  A11yModule,
  MatBottomSheetModule
];

@NgModule({
  imports: materialComponents,
  exports: materialComponents
})
export class MaterialModule {}
