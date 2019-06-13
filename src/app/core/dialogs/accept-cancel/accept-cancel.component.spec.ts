import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptCancelComponent } from './accept-cancel.component';

describe('AcceptCancelComponent', () => {
  let component: AcceptCancelComponent;
  let fixture: ComponentFixture<AcceptCancelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AcceptCancelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptCancelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
