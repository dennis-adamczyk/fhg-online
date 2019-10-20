import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpArticleComponent } from './article.component';

describe('HelpArticleComponent', () => {
  let component: HelpArticleComponent;
  let fixture: ComponentFixture<HelpArticleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelpArticleComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpArticleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
