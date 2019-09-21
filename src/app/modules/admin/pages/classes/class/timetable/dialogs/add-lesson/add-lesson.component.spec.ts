import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLessonDialog } from './add-lesson.component';

describe('AddLessonDialog', () => {
  let component: AddLessonDialog;
  let fixture: ComponentFixture<AddLessonDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AddLessonDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLessonDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
