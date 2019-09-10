import { TestBed } from '@angular/core/testing';

import { HomeworkService } from './homework.service';

describe('HomeworkService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HomeworkService = TestBed.get(HomeworkService);
    expect(service).toBeTruthy();
  });
});
