import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpArticlesComponent } from './help.component';

describe('HelpArticlesComponent', () => {
  let component: HelpArticlesComponent;
  let fixture: ComponentFixture<HelpArticlesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelpArticlesComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpArticlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
