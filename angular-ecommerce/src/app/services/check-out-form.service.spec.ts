import { TestBed } from '@angular/core/testing';

import { CheckOutFormService } from './check-out-form.service';

describe('CheckOutFormService', () => {
  let service: CheckOutFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckOutFormService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
