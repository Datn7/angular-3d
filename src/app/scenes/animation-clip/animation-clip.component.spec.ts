import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationClipComponent } from './animation-clip.component';

describe('AnimationClipComponent', () => {
  let component: AnimationClipComponent;
  let fixture: ComponentFixture<AnimationClipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimationClipComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnimationClipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
