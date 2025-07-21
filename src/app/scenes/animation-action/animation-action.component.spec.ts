import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationActionComponent } from './animation-action.component';

describe('AnimationActionComponent', () => {
  let component: AnimationActionComponent;
  let fixture: ComponentFixture<AnimationActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimationActionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnimationActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
