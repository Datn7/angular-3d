import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationMixerComponent } from './animation-mixer.component';

describe('AnimationMixerComponent', () => {
  let component: AnimationMixerComponent;
  let fixture: ComponentFixture<AnimationMixerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimationMixerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnimationMixerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
