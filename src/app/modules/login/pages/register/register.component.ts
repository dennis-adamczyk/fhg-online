import { Component, OnInit } from '@angular/core';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  AbstractControl
} from '@angular/forms';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.sass']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(public auth: AuthService, private fb: FormBuilder) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      formArray: this.fb.array([
        this.fb.group({
          role: ['']
        }),
        this.fb.group({
          email: ['']
        }),
        this.fb.group({
          first_name: [''],
          last_name: ['']
        }),
        this.fb.group({
          class: ['']
        }),
        this.fb.group({
          password1: [''],
          password2: ['']
        })
      ])
    });
  }

  get formArray(): AbstractControl | null {
    return this.registerForm.get('formArray');
  }
}
