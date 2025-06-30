import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmetViewerComponent } from './helmet-viewer.component';

describe('HelmetViewerComponent', () => {
  let component: HelmetViewerComponent;
  let fixture: ComponentFixture<HelmetViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelmetViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HelmetViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
