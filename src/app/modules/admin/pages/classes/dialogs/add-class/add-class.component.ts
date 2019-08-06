import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { message } from 'src/configs/messages';

@Component({
  selector: 'app-add-class',
  templateUrl: './add-class.component.html',
  styleUrls: ['./add-class.component.sass']
})
export class AddClassDialog implements OnInit {
  classForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AddClassDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit() {
    this.classForm = this.fb.group({
      class: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[5-9][a-f]$|^EF$|^Q1$|^Q2$/i)
        ]
      ]
    });
  }

  get clazz() {
    return this.classForm.get('class');
  }

  getErrorMessage(): string {
    if (this.clazz.hasError('required')) {
      return message.errors.admin.classes.add.required;
    }
    if (this.clazz.hasError('pattern')) {
      return message.errors.admin.classes.add.pattern;
    }
  }

  get prefix(): string {
    if ((this.clazz.value as string).charAt(0).match(/\d/)) {
      return 'Klasse';
    } else if ((this.clazz.value as string).length == 0) {
      return 'Klasse';
    } else {
      return 'Stufe';
    }
  }

  getNewClass(): string {
    if (this.prefix == 'Klasse')
      return (this.clazz.value as string).trim().toLowerCase();
    if (this.prefix == 'Stufe')
      return (this.clazz.value as string).trim().toUpperCase();
  }
}
