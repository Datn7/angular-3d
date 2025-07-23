import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';

import * as THREE from 'three';

@Component({
  selector: 'app-animation-clip',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './animation-clip.component.html',
  styleUrl: './animation-clip.component.scss',
})
export class AnimationClipComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer', { static: true }) containerRef!: ElementRef;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private cube!: THREE.Mesh;
  private mixer!: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private frameId: number = 0;

  ngAfterViewInit(): void {
    this.initThree();
    this.startAnimationLoop();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
    this.renderer.dispose();
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

    // === Animation ===
    // Position animation (bounce up/down)
    const posTimes = [0, 1, 2];
    const posValues = [0, 0, 0, 0, 1, 0, 0, 0, 0];
    const positionTrack = new THREE.VectorKeyframeTrack(
      '.position',
      posTimes,
      posValues
    );

    // Scale animation (pulse)
    const scaleTimes = [0, 1, 2];
    const scaleValues = [1, 1, 1, 2, 2, 2, 1, 1, 1];
    const scaleTrack = new THREE.VectorKeyframeTrack(
      '.scale',
      scaleTimes,
      scaleValues
    );

    // Manual clip creation using constructor
    const clip = new THREE.AnimationClip(
      'BounceAndPulse',
      2, // duration (in seconds)
      [positionTrack, scaleTrack]
    );

    // Mixer + Action
    this.mixer = new THREE.AnimationMixer(this.cube);
    const action = this.mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.play();
  }

  private startAnimationLoop(): void {
    const animate = () => {
      this.frameId = requestAnimationFrame(animate);
      const delta = this.clock.getDelta();
      this.mixer.update(delta);
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}
