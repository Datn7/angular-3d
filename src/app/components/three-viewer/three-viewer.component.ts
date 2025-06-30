import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-three-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './three-viewer.component.html',
  styleUrls: ['./three-viewer.component.scss'],
})
export class ThreeViewerComponent implements OnInit, OnDestroy {
  @ViewChild('viewerContainer', { static: true })
  viewerContainer!: ElementRef<HTMLDivElement>;

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private animationId!: number;
  private directionalLight!: THREE.DirectionalLight;
  private model!: THREE.Object3D;

  private composer!: EffectComposer;
  private saoPass!: SAOPass;

  // UI Controls
  lightIntensity = 1;
  saoIntensity = 0.05;
  envMapIntensity = 1;
  helmetRotationY = 0;
  exposure = 1.4;
  lightColor = '#ffffff';
  enableSAO = true;
  enableShadows = true;
  toneMapping = 'ACESFilmic';
  debugData: any = {};

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initScene();
      this.animate();
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      cancelAnimationFrame(this.animationId);
      this.renderer.dispose();
      this.controls.dispose();
      window.removeEventListener('resize', this.onWindowResize);
    }
  }

  private initScene(): void {
    const container = this.viewerContainer.nativeElement;
    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = this.exposure;
    this.renderer.shadowMap.enabled = this.enableShadows;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Directional Light
    this.directionalLight = new THREE.DirectionalLight(
      this.lightColor,
      this.lightIntensity
    );
    this.directionalLight.position.set(3, 5, 2);
    this.directionalLight.castShadow = true;
    this.scene.add(this.directionalLight);

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Background cubemap
    const cubeLoader = new THREE.CubeTextureLoader();
    const bgTexture = cubeLoader.load([
      '/assets/cubemap/px.png',
      '/assets/cubemap/nx.png',
      '/assets/cubemap/py.png',
      '/assets/cubemap/ny.png',
      '/assets/cubemap/pz.png',
      '/assets/cubemap/nz.png',
    ]);
    this.scene.background = bgTexture;

    // HDR environment
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    new RGBELoader().load('/assets/twilight_sunset_1k.hdr', (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      this.scene.environment = envMap;
      texture.dispose();
      pmremGenerator.dispose();
      this.loadModel();
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    window.addEventListener('resize', this.onWindowResize);
  }

  private loadModel(): void {
    const loader = new GLTFLoader();
    loader.load('/assets/helmet.glb', (gltf) => {
      const model = gltf.scene;
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      this.scene.add(model);
      this.model = model;

      const box = new THREE.Box3().setFromObject(model);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      const fov = this.camera.fov * (Math.PI / 180);
      let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
      cameraZ *= 1.5;
      this.camera.position.set(0, 0, cameraZ);

      this.controls.target.set(0, 0, 0);
      this.controls.update();

      this.composer = new EffectComposer(this.renderer);
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      this.saoPass = new SAOPass(this.scene, this.camera);
      this.saoPass.params.saoIntensity = this.saoIntensity;
      this.saoPass.params.saoScale = 100;
      this.saoPass.params.saoKernelRadius = 16;
      this.saoPass.params.saoMinResolution = 0;
      this.saoPass.params.saoBlur = true;
      this.saoPass.params.saoBlurRadius = 8;
      this.saoPass.params.saoBlurStdDev = 4;
      this.saoPass.params.saoBlurDepthCutoff = 0.01;
      this.composer.addPass(this.saoPass);

      this.updateScene();
    });
  }

  updateScene(): void {
    if (!this.renderer) return;

    this.directionalLight.intensity = this.lightIntensity;
    this.directionalLight.color = new THREE.Color(this.lightColor);
    this.renderer.toneMappingExposure = this.exposure;

    switch (this.toneMapping) {
      case 'ACESFilmic':
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        break;
      case 'Linear':
        this.renderer.toneMapping = THREE.LinearToneMapping;
        break;
      case 'Reinhard':
        this.renderer.toneMapping = THREE.ReinhardToneMapping;
        break;
      case 'Cineon':
        this.renderer.toneMapping = THREE.CineonToneMapping;
        break;
      default:
        this.renderer.toneMapping = THREE.NoToneMapping;
    }

    if (this.saoPass) {
      this.saoPass.enabled = this.enableSAO;
      this.saoPass.params.saoIntensity = this.saoIntensity;
    }

    this.renderer.shadowMap.enabled = this.enableShadows;
    this.debugData = {
      lightIntensity: this.lightIntensity,
      saoIntensity: this.saoIntensity,
      envMapIntensity: this.envMapIntensity,
      helmetRotationY: this.helmetRotationY,
      exposure: this.exposure,
      lightColor: this.lightColor,
      enableSAO: this.enableSAO,
      enableShadows: this.enableShadows,
      toneMapping: this.toneMapping,
      renderer: {
        toneMapping: this.renderer.toneMapping,
        toneMappingExposure: this.renderer.toneMappingExposure,
      },
    };

    if (this.model) {
      this.model.rotation.y = this.helmetRotationY;
    }
  }

  private onWindowResize = () => {
    const container = this.viewerContainer.nativeElement;
    this.camera.aspect = container.clientWidth / container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    if (this.composer) {
      this.composer.setSize(container.clientWidth, container.clientHeight);
    }
  };

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate);
    this.controls.update();
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  };
}
