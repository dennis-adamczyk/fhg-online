import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorPickerDialog } from './color-picker.component';

describe('ColorPickerComponent', () => {
  let component: ColorPickerDialog;
  let fixture: ComponentFixture<ColorPickerDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ColorPickerDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ColorPickerDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
