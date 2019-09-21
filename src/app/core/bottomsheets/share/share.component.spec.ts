import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShareSheet } from './share.component';

describe('ShareSheet', () => {
  let component: ShareSheet;
  let fixture: ComponentFixture<ShareSheet>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ShareSheet]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShareSheet);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
