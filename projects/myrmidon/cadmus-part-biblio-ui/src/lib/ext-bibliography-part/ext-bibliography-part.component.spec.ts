import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtBibliographyPartComponent } from './ext-bibliography-part.component';

describe('ExtBibliographyPartComponent', () => {
  let component: ExtBibliographyPartComponent;
  let fixture: ComponentFixture<ExtBibliographyPartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtBibliographyPartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtBibliographyPartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
