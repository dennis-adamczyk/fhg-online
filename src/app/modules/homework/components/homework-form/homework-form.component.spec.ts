import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeworkFormComponent } from './homework-form.component';

describe('HomeworkFormComponent', () => {
  let component: HomeworkFormComponent;
  let fixture: ComponentFixture<HomeworkFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeworkFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeworkFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
