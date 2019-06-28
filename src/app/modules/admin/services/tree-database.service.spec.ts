import { TestBed } from '@angular/core/testing';

import { TreeDatabaseService } from './tree-database.service';

describe('TreeDatabaseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeDatabaseService = TestBed.get(TreeDatabaseService);
    expect(service).toBeTruthy();
  });
});
