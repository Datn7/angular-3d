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

  private keys: Record<string, boolean> = {};
  private direction = new THREE.Vector3();

  private cameraYaw = 0;

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

    // Lighting
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    this.scene.add(dirLight);

    // Ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x999999 })
    );
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Add random boxes
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x88ccff });
    for (let i = 0; i < 100; i++) {
      const size = Math.random() + 0.5;
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(size, size, size),
        boxMat
      );
      box.position.set(
        (Math.random() - 0.5) * 100,
        size / 2,
        (Math.random() - 0.5) * 100
      );
      this.scene.add(box);
    }

    // Load model
    const loader = new GLTFLoader();
    loader.load('/assets/scifi-girl.glb', (gltf) => {
      this.model = gltf.scene;
      this.model.position.set(0, 0, 0);
      this.scene.add(this.model);

      this.mixer = new THREE.AnimationMixer(this.model);
      const clips = gltf.animations;
      this.walkAction = this.mixer.clipAction(
        clips.find((clip) => clip.name.toLowerCase().includes('walk'))!
      );
      this.idleAction = this.mixer.clipAction(clips[0]);
      this.idleAction.play();
      this.currentAction = this.idleAction;
    });
  }

  animate = () => {
    this.ngZone.runOutsideAngular(() => requestAnimationFrame(this.animate));

    const delta = this.clock.getDelta();
    this.mixer?.update(delta);
    this.updateMovement(delta);
    this.renderer.render(this.scene, this.camera);
  };

  updateMovement(delta: number) {
    if (!this.model) return;

    const moveSpeed = 4;
    const move = new THREE.Vector3();

    if (this.keys['w']) move.z -= 1;
    if (this.keys['s']) move.z += 1;
    if (this.keys['a']) move.x -= 1;
    if (this.keys['d']) move.x += 1;

    const moving = move.lengthSq() > 0;

    // Camera-relative movement
    const cameraRotation = new THREE.Euler(0, this.cameraYaw, 0);
    const forward = new THREE.Vector3(0, 0, -1).applyEuler(cameraRotation);
    const right = new THREE.Vector3(1, 0, 0).applyEuler(cameraRotation);

    const direction = new THREE.Vector3();
    direction
      .addScaledVector(forward, move.z)
      .addScaledVector(right, move.x)
      .normalize();

    if (moving && direction.lengthSq() > 0) {
      this.model.position.add(
        direction.clone().multiplyScalar(moveSpeed * delta)
      );

      // Rotate model toward direction
      const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(
          new THREE.Vector3(0, 0, 0),
          direction,
          new THREE.Vector3(0, 1, 0)
        )
      );
      this.model.quaternion.slerp(targetQuat, 0.15);

      this.setAction(this.walkAction);
    } else {
      this.setAction(this.idleAction);
    }

    // Camera follows character
    const camOffset = new THREE.Vector3(0, 2, 5).applyEuler(
      new THREE.Euler(0, this.cameraYaw, 0)
    );
    const camTarget = this.model.position.clone();
    this.camera.position.copy(camTarget.clone().add(camOffset));
    this.camera.lookAt(camTarget);
  }

  setAction(action: THREE.AnimationAction) {
    if (this.currentAction !== action) {
      this.currentAction.fadeOut(0.2);
      action.reset().fadeIn(0.2).play();
      this.currentAction = action;
    }
  }

  // Keyboard controls
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = true;
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent) {
    this.keys[event.key.toLowerCase()] = false;
  }

  // Mouse move for camera yaw
  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    const movementX = event.movementX || 0;
    this.cameraYaw -= movementX * 0.002;
  }
}
