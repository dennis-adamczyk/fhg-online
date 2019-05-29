import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from './material.module';
import { DocPipe } from './pipes/doc.pipe';
import { ColPipe } from './pipes/col.pipe';

@NgModule({
  declarations: [DocPipe, ColPipe],
  imports: [CommonModule],
  exports: [CommonModule, MaterialModule, DocPipe, ColPipe]
})
export class SharedModule {}
