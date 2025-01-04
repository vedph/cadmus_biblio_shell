import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalIdComponent } from './external-id.component';

describe('ExternalIdComponent', () => {
  let component: ExternalIdComponent;
  let fixture: ComponentFixture<ExternalIdComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ExternalIdComponent]
});
    fixture = TestBed.createComponent(ExternalIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
