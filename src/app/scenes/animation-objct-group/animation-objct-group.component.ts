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
  selector: 'app-animation-objct-group',
  standalone: true,
  imports: [],
  templateUrl: './animation-objct-group.component.html',
  styleUrl: './animation-objct-group.component.scss',
})
export class AnimationObjctGroupComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef;

  private isBrowser: boolean;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mixer!: THREE.AnimationMixer;
  private group!: THREE.AnimationObjectGroup;
  private clock = new THREE.Clock();
  private frameId = 0;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
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
    this.camera.position.z = 6;

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Create shared geometry & material
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshNormalMaterial();

    // Create cubes
    const cubes = [0, 1, 2].map((i) => {
      const cube = new THREE.Mesh(geometry, material);
      cube.position.x = (i - 1) * 2;
      this.scene.add(cube);
      return cube;
    });

    // Shared AnimationObjectGroup
    this.group = new THREE.AnimationObjectGroup(...cubes);

    // Create animation clip (bounce in Y)
    const times = [0, 1, 2];
    const values = [0, 0, 0, 0, 1, 0, 0, 0, 0];
    const positionTrack = new THREE.VectorKeyframeTrack(
      '.position',
      times,
      values
    );
    const clip = new THREE.AnimationClip('Bounce', 2, [positionTrack]);

    // Shared mixer on the group
    this.mixer = new THREE.AnimationMixer(this.group);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.frameId = requestAnimationFrame(animate);
      this.mixer.update(this.clock.getDelta());
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
