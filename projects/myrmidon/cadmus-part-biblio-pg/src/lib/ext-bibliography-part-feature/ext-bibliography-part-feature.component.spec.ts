import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtBibliographyPartFeatureComponent } from './ext-bibliography-part-feature.component';

describe('ExtBibliographyPartFeatureComponent', () => {
  let component: ExtBibliographyPartFeatureComponent;
  let fixture: ComponentFixture<ExtBibliographyPartFeatureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtBibliographyPartFeatureComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtBibliographyPartFeatureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
