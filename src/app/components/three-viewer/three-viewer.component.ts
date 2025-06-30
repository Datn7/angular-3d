import { isPlatformBrowser } from '@angular/common';
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

@Component({
  selector: 'app-three-viewer',
  standalone: true,
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

  private composer!: EffectComposer;

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
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Directional Light with Shadows
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(2, 4, 2);
    directionalLight.castShadow = true;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.mapSize.set(2048, 2048);
    directionalLight.shadow.camera.left = -3;
    directionalLight.shadow.camera.right = 3;
    directionalLight.shadow.camera.top = 3;
    directionalLight.shadow.camera.bottom = -3;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 10;

    // Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(ambientLight);

    // Load background cubemap
    const cubeLoader = new THREE.CubeTextureLoader();
    const bgTexture = cubeLoader.load([
      '/assets/cubemap/px.png',
      '/assets/cubemap/nx.png',
      '/assets/cubemap/py.png',
      '/assets/cubemap/ny.png',
      '/assets/cubemap/pz.png',
      '/assets/cubemap/nz.png',
    ]);
    this.scene.background = bgTexture; // visible background

    // Load HDR environment for reflections
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const rgbeLoader = new RGBELoader();
    rgbeLoader.load('/assets/twilight_sunset_1k.hdr', (texture) => {
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      this.scene.environment = envMap; // reflections
      texture.dispose();
      pmremGenerator.dispose();

      this.loadModel(container);
    });

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    window.addEventListener('resize', this.onWindowResize);
  }

  private loadModel(container: HTMLDivElement): void {
    const loader = new GLTFLoader();
    loader.load(
      '/assets/helmet.glb',
      (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        this.scene.add(model);

        // Auto-center and scale
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

        const minZ = box.min.z;
        const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;
        this.camera.far = cameraToFarEdge * 3;
        this.camera.updateProjectionMatrix();

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        // SAO Setup
        this.composer = new EffectComposer(this.renderer);
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        const saoPass = new SAOPass(this.scene, this.camera);
        saoPass.params.saoIntensity = 0.05; // increase for stronger effect
        saoPass.params.saoScale = 100;
        saoPass.params.saoKernelRadius = 32;
        saoPass.params.saoMinResolution = 0;
        saoPass.params.saoBlur = true;
        saoPass.params.saoBlurRadius = 8;
        saoPass.params.saoBlurStdDev = 4;
        saoPass.params.saoBlurDepthCutoff = 0.01;
        this.composer.addPass(saoPass);

        console.log(
          'Helmet loaded, centered, with SAO, HDR reflections, and background.'
        );
      },
      (progress) => {
        console.log(`Loading: ${(progress.loaded / progress.total) * 100}%`);
      },
      (error) => {
        console.error('Error loading helmet GLB:', error);
      }
    );
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
