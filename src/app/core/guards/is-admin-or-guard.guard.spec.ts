import { TestBed, async, inject } from '@angular/core/testing';

import { IsAdminOrGuardGuard } from './is-admin-or-guard.guard';

describe('IsAdminOrGuardGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [IsAdminOrGuardGuard]
    });
  });

  it('should ...', inject([IsAdminOrGuardGuard], (guard: IsAdminOrGuardGuard) => {
    expect(guard).toBeTruthy();
  }));
});
