import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KeywordPickerComponent } from './keyword-picker.component';

describe('KeywordPickerComponent', () => {
  let component: KeywordPickerComponent;
  let fixture: ComponentFixture<KeywordPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ KeywordPickerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KeywordPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
