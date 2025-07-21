import {
  Component,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Inject,
} from '@angular/core';
import * as THREE from 'three';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-hero-three',
  standalone: true,
  templateUrl: './hero-three.component.html',
  styleUrls: ['./hero-three.component.scss'],
})
export class HeroThreeComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private sphere!: THREE.Mesh;
  private glowMesh!: THREE.Mesh;
  private animationFrameId!: number;
  private mouse = { x: 0, y: 0 };
  private clock = new THREE.Clock();

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      requestAnimationFrame(() => {
        this.initScene();
        this.animate();
        window.addEventListener('mousemove', this.onMouseMove);
      });
    }
  }

  private initScene() {
    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    (this.renderer as any).colorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();

    const fov = 45;
    const aspect = canvas.clientWidth / canvas.clientHeight;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    // Main Sphere
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x009999,
      roughness: 0.2,
      metalness: 0.9,
    });

    const geometry = new THREE.SphereGeometry(1, 64, 64);
    this.sphere = new THREE.Mesh(geometry, baseMaterial);
    this.scene.add(this.sphere);

    // Glow Shell
    const glowGeometry = new THREE.SphereGeometry(1.1, 64, 64);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ffff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    this.scene.add(this.glowMesh);

    // Lights
    const pointLight = new THREE.PointLight(0x00ffff, 1.5, 20);
    pointLight.position.set(2, 3, 5);
    this.scene.add(pointLight);

    const ambient = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambient);
  }

  private animate = () => {
    const delta = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;

    // Animate sphere and glow
    this.sphere.rotation.y += delta * 0.5;
    this.sphere.rotation.x = Math.sin(elapsed * 0.5) * 0.2;
    this.glowMesh.rotation.y -= delta * 0.3;

    const pulse = (Math.sin(elapsed * 2.5) + 1) * 0.15 + 0.2;
    (this.glowMesh.material as THREE.MeshBasicMaterial).opacity = pulse;

    // Camera parallax
    this.camera.position.x +=
      (this.mouse.x * 2 - this.camera.position.x) * 0.05;
    this.camera.position.y +=
      (this.mouse.y * 2 - this.camera.position.y) * 0.05;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  private onMouseMove = (event: MouseEvent) => {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  };

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationFrameId);
      this.renderer.dispose();
      window.removeEventListener('mousemove', this.onMouseMove);
    }
  }
}
