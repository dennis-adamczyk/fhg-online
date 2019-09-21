import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AcceptCancelDialog } from './accept-cancel.component';

describe('AcceptCancelDialog', () => {
  let component: AcceptCancelDialog;
  let fixture: ComponentFixture<AcceptCancelDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AcceptCancelDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcceptCancelDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
