import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkBrowserComponent } from './work-browser.component';

describe('WorkBrowserComponent', () => {
  let component: WorkBrowserComponent;
  let fixture: ComponentFixture<WorkBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WorkBrowserComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
