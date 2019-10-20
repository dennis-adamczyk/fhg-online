import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpArticleEditComponent } from './article.component';

describe('HelpArticleEditComponent', () => {
  let component: HelpArticleEditComponent;
  let fixture: ComponentFixture<HelpArticleEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelpArticleEditComponent]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelpArticleEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
