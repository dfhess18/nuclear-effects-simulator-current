/**
 * blastSpheres.ts — Mapbox custom layer that renders effect rings as 3D spheres.
 *
 * Each ring becomes a sphere centered at the burst point (HOB altitude for an
 * airburst, ground level for a surface burst). The sphere's slant radius is
 *   r_slant = sqrt(groundRadius² + HOB²)
 * so that the sphere intersects the ground plane at exactly the ground radius
 * computed by the physics module. This keeps the 2D ground rings and 3D spheres
 * geometrically consistent without changing any physics.
 *
 * Surface burst (HOB=0): center at ground, radius = groundRadius → visible
 *   half is a hemisphere sitting on the ground.
 * Airburst: center at altitude, full sphere visible (intersecting ground inside
 *   ring radius).
 *
 * Implementation follows the standard Mapbox + Three.js custom layer pattern:
 *   https://docs.mapbox.com/mapbox-gl-js/example/add-3d-model/
 * Uses one shared model transform anchored at the burst point — every mesh in
 * the scene sits at scene-origin and is sized in meters; the transform converts
 * meters → Mercator units and Y-up (Three.js) → Z-up (Mapbox).
 */

import * as THREE from "three";
import mapboxgl from "mapbox-gl";
import type { EffectRing } from "../../lib/physics/types";

export interface BlastSpheresLayer extends mapboxgl.CustomLayerInterface {
  setBurst(
    gz: { lat: number; lng: number } | null,
    hobM: number,
    rings: EffectRing[]
  ): void;
}

export function createBlastSpheresLayer(): BlastSpheresLayer {
  const scene = new THREE.Scene();
  // Generic Camera (not Perspective) — projection matrix is provided by Mapbox.
  const camera = new THREE.Camera();

  // Scene lighting. DirectionalLight angled so spheres show some shading
  // when the user pitches the camera.
  const ambient = new THREE.AmbientLight(0xffffff, 0.65);
  const dir = new THREE.DirectionalLight(0xffffff, 0.55);
  dir.position.set(0.4, 0.8, 1).normalize();
  scene.add(ambient, dir);

  // Shared sphere geometry — meshes scale it to their radius in meters.
  const sphereGeom = new THREE.SphereGeometry(1, 48, 24);

  // Burst-point indicator (small bright sphere at the burst center).
  // Visible at altitude for airbursts; sits on the ground for surface bursts.
  const burstIndicator = new THREE.Mesh(
    new THREE.SphereGeometry(1, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xff3030 })
  );
  burstIndicator.renderOrder = 100;
  scene.add(burstIndicator);

  // Vertical "drop line" from the ground to the burst point — only shown for
  // airbursts. A thin cylinder makes the HOB visually obvious.
  const dropLineGeom = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const dropLineMat = new THREE.MeshBasicMaterial({
    color: 0xff3030,
    transparent: true,
    opacity: 0.55,
  });
  const dropLine = new THREE.Mesh(dropLineGeom, dropLineMat);
  scene.add(dropLine);

  const ringMeshes: THREE.Mesh[] = [];

  let renderer: THREE.WebGLRenderer | null = null;
  let mapInstance: mapboxgl.Map | null = null;

  // Current burst state — read each frame to compute the model transform.
  let currentGz: { lat: number; lng: number } | null = null;
  let currentHobM = 0;
  let currentRings: EffectRing[] = [];

  function syncMeshes() {
    // Pop excess
    while (ringMeshes.length > currentRings.length) {
      const m = ringMeshes.pop()!;
      scene.remove(m);
      (m.material as THREE.Material).dispose();
    }

    // Largest first so smaller spheres render on top.
    const sorted = [...currentRings].sort((a, b) => b.radiusM - a.radiusM);
    sorted.forEach((ring, i) => {
      // Slant radius — sphere intersects ground at exactly ring.radiusM.
      const slantR = Math.sqrt(ring.radiusM ** 2 + currentHobM ** 2);

      let mesh = ringMeshes[i];
      if (!mesh) {
        const mat = new THREE.MeshPhongMaterial({
          color: new THREE.Color(ring.color),
          transparent: true,
          opacity: Math.max(ring.fillOpacity, 0.18),
          depthWrite: false,
          side: THREE.DoubleSide,
        });
        mesh = new THREE.Mesh(sphereGeom, mat);
        scene.add(mesh);
        ringMeshes[i] = mesh;
      } else {
        const mat = mesh.material as THREE.MeshPhongMaterial;
        mat.color.set(ring.color);
        mat.opacity = Math.max(ring.fillOpacity, 0.18);
      }
      mesh.position.set(0, 0, 0);
      mesh.scale.setScalar(slantR);
      // Larger renders first (further back).
      mesh.renderOrder = sorted.length - i;
    });

    // Burst indicator: ~50 m radius for visibility at city scale.
    burstIndicator.scale.setScalar(50);
    burstIndicator.visible = currentGz !== null;

    // Drop line: only for airbursts. Cylinder default is along Y axis with
    // height 1, centered at origin → it spans y ∈ [-0.5, +0.5]. Scene origin
    // sits at the burst point (altitude HOB). We want the line to span from
    // the ground up to the burst point, so translate it down by HOB/2 in
    // scene Y (which becomes world Z after the transform's rotation flip).
    if (currentGz && currentHobM > 0) {
      dropLine.visible = true;
      // Scale: thin radius (8 m), height = HOB.
      // Three.js cylinder is along Y; after rotateX(π/2) in the model
      // transform, scene Y maps to world Z (up). So height in scene-Y ==
      // height in world-Z. Center it half-way between ground and burst.
      dropLine.scale.set(8, currentHobM, 8);
      // Move down in scene-Y by half the height — after the model transform,
      // this places the cylinder spanning [0, HOB] in world altitude (with
      // the burst point at HOB).
      dropLine.position.set(0, -currentHobM / 2, 0);
      dropLine.rotation.set(0, 0, 0);
    } else {
      dropLine.visible = false;
    }
  }

  return {
    id: "blast-spheres",
    type: "custom" as const,
    renderingMode: "3d" as const,

    onAdd(map: mapboxgl.Map, gl: WebGL2RenderingContext) {
      mapInstance = map;
      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
    },

    onRemove() {
      renderer?.dispose();
      renderer = null;
      mapInstance = null;
    },

    setBurst(gz, hobM, rings) {
      currentGz = gz;
      currentHobM = hobM;
      currentRings = rings;
      syncMeshes();
      mapInstance?.triggerRepaint();
    },

    render(_gl: WebGL2RenderingContext, matrix: number[]) {
      if (!renderer || !currentGz) return;

      const merc = mapboxgl.MercatorCoordinate.fromLngLat(
        { lng: currentGz.lng, lat: currentGz.lat },
        currentHobM
      );
      const scale = merc.meterInMercatorCoordinateUnits();

      // Rotate Three.js Y-up scene so scene-Y aligns with world-Z (altitude).
      const rotX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        Math.PI / 2
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(merc.x, merc.y, merc.z)
        // Negative Y scale flips Mapbox's south-positive Y to match Three.js
        // after the X rotation. This is the standard Mapbox/Three.js example
        // pattern.
        .scale(new THREE.Vector3(scale, -scale, scale))
        .multiply(rotX);

      camera.projectionMatrix = m.multiply(l);
      renderer.resetState();
      renderer.render(scene, camera);
      mapInstance?.triggerRepaint();
    },
  };
}
