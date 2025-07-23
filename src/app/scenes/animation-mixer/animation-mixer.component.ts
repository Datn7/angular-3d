import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-animation-mixer',
  standalone: true,
  imports: [],
  templateUrl: './animation-mixer.component.html',
  styleUrl: './animation-mixer.component.scss',
})
export class AnimationMixerComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef;

  private isBrowser: boolean;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cube!: THREE.Mesh;
  private mixer!: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private frameId = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    if (this.isBrowser) {
      this.initThree();
      this.startAnimationLoop();
    }
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      cancelAnimationFrame(this.frameId);
      this.renderer.dispose();
    }
  }

  private initThree(): void {
    const container = this.containerRef.nativeElement;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();
    this.cube = new THREE.Mesh(geometry, material);
    this.scene.add(this.cube);

    // AnimationClip
    const times = [0, 1, 2];
    const values = [
      0,
      0,
      0, // at 0s
      0,
      1,
      0, // at 1s
      0,
      0,
      0, // at 2s
    ];
    const track = new THREE.VectorKeyframeTrack('.position', times, values);
    const clip = new THREE.AnimationClip('Bounce', 2, [track]);

    // AnimationMixer for this cube
    this.mixer = new THREE.AnimationMixer(this.cube);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.frameId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.mixer.update(delta); // REQUIRED
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
