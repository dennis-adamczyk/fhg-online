import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditHomeworkComponent } from './edit-homework.component';

describe('EditHomeworkComponent', () => {
  let component: EditHomeworkComponent;
  let fixture: ComponentFixture<EditHomeworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditHomeworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditHomeworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
