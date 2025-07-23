import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AframeArComponent } from './aframe-ar.component';

describe('AframeArComponent', () => {
  let component: AframeArComponent;
  let fixture: ComponentFixture<AframeArComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AframeArComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AframeArComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
