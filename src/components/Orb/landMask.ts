/**
 * Procedural low-res Earth land mask for particle sphere classification.
 * A 360 x 180 1-bit lookup array:
 * 1 = continental landmass (rendered with bright near-white dots)
 * 0 = ocean dot field (rendered with brand-orange dots)
 */

const WIDTH = 360;
const HEIGHT = 180;
let maskCache: Uint8Array | null = null;

// Approximate major continental bounding ellipses: [centerLon, centerLat, radiusLon, radiusLat]
// Lon: -180 to 180, Lat: -90 to 90
const LAND_ELLIPSES: Array<[number, number, number, number]> = [
  // North America
  [-100, 48, 38, 24],
  [-115, 38, 18, 16],
  [-85, 35, 16, 14],
  [-105, 62, 35, 15],
  // Greenland
  [-40, 72, 18, 12],
  // Central America
  [-90, 16, 14, 8],
  // South America
  [-60, -15, 22, 28],
  [-65, -35, 12, 18],
  // Europe
  [15, 52, 22, 14],
  [30, 60, 24, 14],
  [5, 45, 14, 10],
  // UK / Ireland
  [-3, 54, 6, 6],
  // Africa
  [20, 5, 24, 28],
  [22, 24, 20, 12],
  [25, -20, 16, 16],
  // Asia
  [75, 55, 45, 22],
  [105, 55, 38, 20],
  [80, 25, 20, 14], // India
  [105, 32, 24, 16], // China
  [130, 62, 30, 16], // Siberia
  [120, 48, 25, 14],
  // Japan
  [138, 36, 6, 8],
  // Southeast Asia & Indonesia
  [102, 12, 14, 10],
  [115, -2, 18, 8],
  // Australia
  [134, -25, 22, 16],
  // New Zealand
  [172, -42, 6, 8],
  // Antarctica
  [0, -82, 180, 10],
];

export function getLandMask(): Uint8Array {
  if (maskCache) return maskCache;

  const mask = new Uint8Array(WIDTH * HEIGHT);

  for (let y = 0; y < HEIGHT; y++) {
    const lat = 90 - y; // from 90 (north) to -90 (south)
    for (let x = 0; x < WIDTH; x++) {
      const lon = x - 180; // from -180 (west) to 180 (east)

      let isLand = 0;
      for (let i = 0; i < LAND_ELLIPSES.length; i++) {
        const [cLon, cLat, rLon, rLat] = LAND_ELLIPSES[i];
        const dx = (lon - cLon) / rLon;
        const dy = (lat - cLat) / rLat;
        if (dx * dx + dy * dy <= 1.0) {
          isLand = 1;
          break;
        }
      }

      mask[y * WIDTH + x] = isLand;
    }
  }

  maskCache = mask;
  return mask;
}

/**
 * Tests if spherical coordinates [theta, phi] land on a continent.
 * theta: azimuthal angle around Y (0 to 2*PI)
 * phi: polar angle from +Y (0 = north pole, PI = south pole)
 */
export function isLandPoint(theta: number, phi: number): boolean {
  const mask = getLandMask();

  // Normalize lon to [-180, 180]
  let lonDeg = ((theta % (2 * Math.PI)) / Math.PI) * 180 - 180;
  if (lonDeg < -180) lonDeg += 360;
  if (lonDeg >= 180) lonDeg -= 360;

  // Normalize lat to [-90, 90]
  const latDeg = 90 - (phi / Math.PI) * 180;

  const x = Math.min(WIDTH - 1, Math.max(0, Math.floor(lonDeg + 180)));
  const y = Math.min(HEIGHT - 1, Math.max(0, Math.floor(90 - latDeg)));

  return mask[y * WIDTH + x] === 1;
}
