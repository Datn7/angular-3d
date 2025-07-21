import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-animation-action',
  standalone: true,
  templateUrl: './animation-action.component.html',
  styleUrls: ['./animation-action.component.scss'],
})
export class AnimationActionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true })
  canvasRef!: ElementRef<HTMLCanvasElement>;

  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private mixer!: THREE.AnimationMixer;
  private action!: THREE.AnimationAction;
  private clock = new THREE.Clock();

  private modelUrl = '/assets/scifi-girl.glb';
  private animationFrameId!: number;

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined') {
      this.initScene();
      this.loadModel();
      this.animate();
    }
  }

  private initScene() {
    const canvas = this.canvasRef.nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    (this.renderer as any).colorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.4;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);

    this.camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.5, 3);

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);

    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 10, 7.5);
    light.castShadow = true;
    this.scene.add(light);

    const controls = new OrbitControls(this.camera, canvas);
    controls.target.set(0, 1, 0);
    controls.update();
  }

  private loadModel() {
    const loader = new GLTFLoader();
    loader.load(this.modelUrl, (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const material = mesh.material as THREE.MeshStandardMaterial;
          if (material) {
            material.depthWrite = true;
            material.depthTest = true;
            material.transparent = material.opacity < 1.0;
            material.side = THREE.DoubleSide;
            material.needsUpdate = true;
          }
        }
      });

      this.scene.add(model);

      this.mixer = new THREE.AnimationMixer(model);
      if (gltf.animations.length > 0) {
        const clip = gltf.animations[0];
        this.action = this.mixer.clipAction(clip);
        this.action.setLoop(THREE.LoopRepeat, 2);
        this.action.setEffectiveWeight(1.0);
        this.action.setEffectiveTimeScale(1.0);
        this.action.fadeIn(1.0);
        this.action.play();
      }
    });
  }

  private animate = () => {
    const delta = this.clock.getDelta();
    if (this.mixer) this.mixer.update(delta);
    this.renderer.render(this.scene, this.camera);
    this.animationFrameId = requestAnimationFrame(this.animate);
  };

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
      this.renderer.dispose();
    }
  }
}
