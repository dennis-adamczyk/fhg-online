import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SanctionDialog } from './sanction.component';

describe('SanctionDialog', () => {
  let component: SanctionDialog;
  let fixture: ComponentFixture<SanctionDialog>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SanctionDialog]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SanctionDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
