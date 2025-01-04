import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkAuthorsComponent } from './work-authors.component';

describe('WorkAuthorsComponent', () => {
  let component: WorkAuthorsComponent;
  let fixture: ComponentFixture<WorkAuthorsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [WorkAuthorsComponent]
})
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WorkAuthorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
