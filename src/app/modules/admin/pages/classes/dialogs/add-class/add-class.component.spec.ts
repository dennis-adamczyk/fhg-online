import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddClassDialog } from './add-class.component';

describe('AddClassDialog', () => {
  let component: AddClassDialog;
  let fixture: ComponentFixture<AddClassDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddClassDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddClassDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
