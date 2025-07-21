import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroThreeComponent } from './hero-three.component';

describe('HeroThreeComponent', () => {
  let component: HeroThreeComponent;
  let fixture: ComponentFixture<HeroThreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroThreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeroThreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
