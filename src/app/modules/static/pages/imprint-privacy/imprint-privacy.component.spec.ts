import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ImprintPrivacyComponent } from './imprint-privacy.component';

describe('ImprintPrivacyComponent', () => {
  let component: ImprintPrivacyComponent;
  let fixture: ComponentFixture<ImprintPrivacyComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ImprintPrivacyComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ImprintPrivacyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
