import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkKeywordsComponent } from './work-keywords.component';

describe('WorkKeywordsComponent', () => {
  let component: WorkKeywordsComponent;
  let fixture: ComponentFixture<WorkKeywordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WorkKeywordsComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkKeywordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
