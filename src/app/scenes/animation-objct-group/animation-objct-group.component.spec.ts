import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimationObjctGroupComponent } from './animation-objct-group.component';

describe('AnimationObjctGroupComponent', () => {
  let component: AnimationObjctGroupComponent;
  let fixture: ComponentFixture<AnimationObjctGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnimationObjctGroupComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnimationObjctGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
