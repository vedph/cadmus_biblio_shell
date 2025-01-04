import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BiblioPageComponent } from './biblio-page.component';

describe('BiblioPageComponent', () => {
  let component: BiblioPageComponent;
  let fixture: ComponentFixture<BiblioPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    declarations: [BiblioPageComponent]
})
    .compileComponents();

    fixture = TestBed.createComponent(BiblioPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
