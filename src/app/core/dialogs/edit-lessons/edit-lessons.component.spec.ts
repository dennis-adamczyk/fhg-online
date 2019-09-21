import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLessonsDialog } from './edit-lessons.component';

describe('EditLessonsComponent', () => {
  let component: EditLessonsDialog;
  let fixture: ComponentFixture<EditLessonsDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditLessonsDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLessonsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
