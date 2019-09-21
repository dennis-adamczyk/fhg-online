import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LessonDetailsDialog } from './lesson-details.component';

describe('LessonDetailsDialog', () => {
  let component: LessonDetailsDialog;
  let fixture: ComponentFixture<LessonDetailsDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LessonDetailsDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LessonDetailsDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
