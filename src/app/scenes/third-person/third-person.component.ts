import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Inject,
  NgZone,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-third-person',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './third-person.component.html',
  styleUrl: './third-person.component.scss',
})
export class ThirdPersonComponent implements AfterViewInit {
  @ViewChild('canvasContainer', { static: true }) canvasRef!: ElementRef;

  private scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private mixer!: THREE.AnimationMixer;
  private clock = new THREE.Clock();
  private model!: THREE.Object3D;
  private walkAction!: THREE.AnimationAction;
  private idleAction!: THREE.AnimationAction;
  private currentAction!: THREE.AnimationAction;
  private controls!: OrbitControls;

  private keys: Record<string, boolean> = {};
  private direction = new THREE.Vector3();

  constructor(
    private ngZone: NgZone,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initScene();
      this.animate();
    }
  }

  initScene() {
    const container = this.canvasRef.nativeElement;

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 2, 5);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Orbit Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.maxPolarAngle = Math.PI / 2;
    this.controls.target.set(0, 1, 0);
    this.controls.update();

    // Lights
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 7.5);
    this.scene.add(light);

    const ambient = new THREE.AmbientLight(0x404040);
    this.scene.add(ambient);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x999999 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Add random boxes
    const boxMaterial = new THREE.MeshStandardMaterial({ color: 0x88ccff });
    for (let i = 0; i < 100; i++) {
      const size = Math.random() * 1 + 0.5;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        boxMaterial
      );
      box.position.set(
        (Math.random() - 0.5) * 100,
        size / 2,
        (Math.random() - 0.5) * 100
      );
      this.scene.add(box);
    }

    // Load character
    const loader = new GLTFLoader();
    loader.load('/assets/scifi-girl.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          (child as THREE.Mesh).castShadow = true;
        }
      });

      this.model.position.set(0, 0, 0);
      this.scene.add(this.model);

      // Animations
      this.mixer = new THREE.AnimationMixer(this.model);
      const clips = gltf.animations;
      this.walkAction = this.mixer.clipAction(
        clips.find((c) => c.name.toLowerCase().includes('walk'))!
      );
      this.idleAction = this.mixer.clipAction(clips[0]);
      this.idleAction.play();
      this.currentAction = this.idleAction;
    });
  }

  animate = () => {
    this.ngZone.runOutsideAngular(() => {
      requestAnimationFrame(this.animate);
    });

    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);

    this.updateControls(delta);
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
  };

  updateControls(delta: number) {
    if (!this.model) return;

    const speed = 3;
    this.direction.set(0, 0, 0);

    if (this.keys['w']) this.direction.z -= 1;
    if (this.keys['s']) this.direction.z += 1;
    if (this.keys['a']) this.direction.x -= 1;
    if (this.keys['d']) this.direction.x += 1;

    if (this.direction.lengthSq() > 0.01) {
      this.direction.normalize();

      // Smooth rotation toward direction
      const targetAngle = Math.atan2(this.direction.x, this.direction.z);
      const targetQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, targetAngle, 0)
      );
      this.model.quaternion.slerp(targetQuat, 0.15);

      // Move forward
      const forward = new THREE.Vector3(0, 0, -1)
        .applyQuaternion(this.model.quaternion)
        .normalize();
      this.model.position.add(forward.multiplyScalar(speed * delta));

      this.setAction(this.walkAction);
    } else {
      this.setAction(this.idleAction);
    }

    // Camera follow from behind
    const camOffset = new THREE.Vector3(0, 2.5, -5).applyQuaternion(
      this.model.quaternion
    );
    this.camera.position.copy(this.model.position.clone().add(camOffset));
    this.camera.lookAt(this.model.position);
  }

  setAction(action: THREE.AnimationAction) {
    if (this.currentAction !== action) {
      this.currentAction.fadeOut(0.2);
      action.reset().fadeIn(0.2).play();
      this.currentAction = action;
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = true;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = false;
  }
}
