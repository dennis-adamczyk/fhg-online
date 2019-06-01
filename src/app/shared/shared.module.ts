import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { DocPipe } from './pipes/doc.pipe';
import { ColPipe } from './pipes/col.pipe';
import { ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [DocPipe, ColPipe],
  imports: [CommonModule],
  exports: [CommonModule, MaterialModule, DocPipe, ColPipe, ReactiveFormsModule]
})
export class SharedModule {}
