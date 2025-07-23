import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';

@Component({
  selector: 'app-aframe-ar',
  standalone: true,
  imports: [],
  templateUrl: './aframe-ar.component.html',
  styleUrl: './aframe-ar.component.scss',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AframeArComponent implements AfterViewInit {
  ngAfterViewInit(): void {
    const sceneEl = document.querySelector('a-scene') as any;

    // Declare session variables
    let refSpace: XRReferenceSpace | null = null;
    let hitTestSource: XRHitTestSource | null = null;
    let latestPosition: { x: number; y: number; z: number } | null = null;

    sceneEl.addEventListener('enter-vr', () => {
      const xrSession: XRSession = sceneEl.renderer.xr.getSession();
      if (!xrSession) return;

      // Request viewer reference space for hit testing
      xrSession
        .requestReferenceSpace('viewer')
        .then((viewerSpace: XRReferenceSpace) => {
          //  Runtime check: make sure the method exists
          if (typeof xrSession.requestHitTestSource === 'function') {
            return xrSession.requestHitTestSource({ space: viewerSpace });
          } else {
            console.warn(
              'requestHitTestSource is not supported on this device.'
            );
            return Promise.reject('Hit test not supported');
          }
        })
        .then((source) => {
          if (!source) {
            console.warn('Hit test source is undefined.');
            return;
          }
          hitTestSource = source;
        })
        .catch((err) => {
          console.error('Could not get hit test source:', err);
        });

      // Request reference space for placing content
      xrSession.requestReferenceSpace('local').then((space) => {
        refSpace = space as XRReferenceSpace;
      });

      const reticle = document.getElementById('reticle');
      const model = document.getElementById('model');

      // Hit test and place reticle each frame
      sceneEl.renderer.setAnimationLoop((timestamp: number, frame: XRFrame) => {
        if (!frame || !hitTestSource || !refSpace) return;

        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(refSpace);
          if (!pose) return;

          const pos = pose.transform.position;
          reticle?.setAttribute('visible', 'true');
          reticle?.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
          latestPosition = { x: pos.x, y: pos.y, z: pos.z };
        }
      });

      // Place the model on user tap
      sceneEl.sceneEl.addEventListener('click', () => {
        if (!latestPosition) return;

        model?.setAttribute(
          'position',
          `${latestPosition.x} ${latestPosition.y} ${latestPosition.z}`
        );
        model?.setAttribute('visible', 'true');
        reticle?.setAttribute('visible', 'false');
      });
    });
  }
}
