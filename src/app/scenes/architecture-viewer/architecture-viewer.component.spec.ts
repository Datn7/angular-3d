import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArchitectureViewerComponent } from './architecture-viewer.component';

describe('ArchitectureViewerComponent', () => {
  let component: ArchitectureViewerComponent;
  let fixture: ComponentFixture<ArchitectureViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchitectureViewerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ArchitectureViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
