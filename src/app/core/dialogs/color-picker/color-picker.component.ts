import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { database } from 'firebase';
import { constant } from 'src/configs/constants';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.sass']
})
export class ColorPickerDialog implements OnInit {
  constant = constant;
  selection: string[];
  swatches: string[];
  shades: string[];

  constructor(
    public dialogRef: MatDialogRef<ColorPickerDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    if (!this.data.color) this.selection = ['', '500'];
    else this.selection = this.data.color.split(' ');
    this.swatches = Object.keys(constant.colors);
  }

  keysOf(obj: object): string[] {
    return Object.keys(obj);
  }

  onSelectSwatch(swatch: string) {
    this.selection[0] = swatch;
    if (this.keysOf(constant.colorsContrast[swatch]).length == 1)
      this.selection[1] = '500';
  }

  onSelectShade(shade: string) {
    this.selection[1] = shade;
  }
}
