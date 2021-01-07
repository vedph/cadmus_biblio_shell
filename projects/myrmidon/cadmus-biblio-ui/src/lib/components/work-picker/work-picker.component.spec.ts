import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkPickerComponent } from './work-picker.component';

describe('WorkPickerComponent', () => {
  let component: WorkPickerComponent;
  let fixture: ComponentFixture<WorkPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WorkPickerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
