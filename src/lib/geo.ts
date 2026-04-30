import * as THREE from 'three';
import { GLOBE } from './constants';

/**
 * Convert latitude/longitude to a Vector3 on the globe surface.
 * @param lat Latitude in degrees (-90 to 90)
 * @param lng Longitude in degrees (-180 to 180)
 * @param altitude Height above globe surface (0 = on surface)
 */
export function latLngToVector3(
  lat: number,
  lng: number,
  altitude: number = 0,
): THREE.Vector3 {
  const radius = GLOBE.RADIUS + altitude;
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

/**
 * Convert a Vector3 on the globe back to latitude/longitude.
 */
export function vector3ToLatLng(v: THREE.Vector3): { lat: number; lng: number } {
  const radius = v.length();
  const lat = 90 - Math.acos(v.y / radius) * (180 / Math.PI);
  const lng = Math.atan2(v.z, -v.x) * (180 / Math.PI) - 180;
  return {
    lat,
    lng: lng < -180 ? lng + 360 : lng,
  };
}

/**
 * Great-circle distance between two lat/lng points in km.
 */
export function greatCircleDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Check if a point on the globe is facing the camera (not on the back side).
 * Returns true if the point is visible.
 */
export function isPointFacingCamera(
  pointPosition: THREE.Vector3,
  cameraPosition: THREE.Vector3,
): boolean {
  const normal = pointPosition.clone().normalize();
  const toCamera = cameraPosition.clone().sub(pointPosition).normalize();
  return normal.dot(toCamera) > 0;
}

/**
 * Convert GeoJSON coordinates [lng, lat] array to Vector3 array on globe surface.
 */
export function geoJsonCoordsToVector3Array(
  coords: [number, number][],
  altitude: number = 0.001,
): THREE.Vector3[] {
  return coords.map(([lng, lat]) => latLngToVector3(lat, lng, altitude));
}
