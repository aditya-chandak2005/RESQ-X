/**
 * High-precision simplified boundary geometry and centroids for Indian states.
 * Enables clear administrative visibility, boundary lines, and state identification
 * over satellite and tactical map layers.
 */

export interface StateBoundaryFeature {
  id: string;
  name: string;
  capital: string;
  status: 'critical_alert' | 'watch' | 'normal';
  alertCount: number;
  center: [number, number]; // [lat, lng]
  coordinates: number[][][]; // GeoJSON Polygon [lng, lat]
}

export const INDIA_STATE_BOUNDARIES: StateBoundaryFeature[] = [
  {
    id: 'uttarakhand',
    name: 'Uttarakhand (Active Disaster Theater)',
    capital: 'Dehradun / Gairsain',
    status: 'critical_alert',
    alertCount: 3,
    center: [30.3165, 79.1500],
    coordinates: [[
      [77.57, 30.40],
      [77.72, 30.95],
      [78.05, 31.25],
      [78.40, 31.45],
      [78.90, 31.40],
      [79.25, 31.10],
      [79.55, 31.05],
      [79.85, 31.00],
      [80.35, 30.65],
      [80.85, 30.30],
      [80.95, 30.00],
      [80.55, 29.50],
      [80.10, 28.85],
      [79.50, 29.00],
      [78.90, 29.30],
      [78.35, 29.50],
      [77.90, 29.80],
      [77.57, 30.40]
    ]]
  },
  {
    id: 'himachal_pradesh',
    name: 'Himachal Pradesh',
    capital: 'Shimla',
    status: 'watch',
    alertCount: 1,
    center: [31.90, 77.20],
    coordinates: [[
      [75.60, 32.25],
      [76.35, 32.85],
      [76.90, 33.25],
      [77.60, 32.90],
      [78.60, 32.40],
      [78.90, 31.80],
      [78.40, 31.45],
      [77.72, 30.95],
      [77.40, 30.50],
      [76.70, 30.90],
      [76.10, 31.40],
      [75.60, 32.25]
    ]]
  },
  {
    id: 'uttar_pradesh',
    name: 'Uttar Pradesh',
    capital: 'Lucknow',
    status: 'normal',
    alertCount: 0,
    center: [27.15, 80.90],
    coordinates: [[
      [77.57, 30.40],
      [77.90, 29.80],
      [78.35, 29.50],
      [78.90, 29.30],
      [80.10, 28.85],
      [81.20, 28.40],
      [82.50, 27.80],
      [83.80, 27.35],
      [84.40, 26.80],
      [84.20, 25.80],
      [83.20, 24.80],
      [82.80, 23.90],
      [81.50, 24.80],
      [79.80, 25.10],
      [78.50, 25.20],
      [78.10, 26.80],
      [77.30, 27.80],
      [77.20, 28.60],
      [77.57, 30.40]
    ]]
  },
  {
    id: 'delhi',
    name: 'National Capital Territory of Delhi',
    capital: 'New Delhi',
    status: 'normal',
    alertCount: 0,
    center: [28.65, 77.20],
    coordinates: [[
      [76.85, 28.40],
      [77.35, 28.40],
      [77.35, 28.88],
      [76.85, 28.88],
      [76.85, 28.40]
    ]]
  },
  {
    id: 'haryana',
    name: 'Haryana',
    capital: 'Chandigarh',
    status: 'normal',
    alertCount: 0,
    center: [29.20, 76.30],
    coordinates: [[
      [74.50, 29.80],
      [75.20, 30.20],
      [76.70, 30.90],
      [77.40, 30.50],
      [77.20, 28.60],
      [77.30, 27.80],
      [76.40, 28.10],
      [75.80, 28.80],
      [74.50, 29.80]
    ]]
  },
  {
    id: 'punjab',
    name: 'Punjab',
    capital: 'Chandigarh',
    status: 'normal',
    alertCount: 0,
    center: [30.90, 75.40],
    coordinates: [[
      [74.20, 30.10],
      [74.70, 31.40],
      [75.30, 32.30],
      [75.60, 32.25],
      [76.70, 30.90],
      [75.20, 30.20],
      [74.20, 30.10]
    ]]
  },
  {
    id: 'assam',
    name: 'Assam (Brahmaputra Basin)',
    capital: 'Dispur',
    status: 'watch',
    alertCount: 1,
    center: [26.20, 92.90],
    coordinates: [[
      [89.70, 26.10],
      [90.30, 26.80],
      [92.50, 27.10],
      [95.20, 27.80],
      [96.00, 27.50],
      [95.40, 26.80],
      [93.80, 26.00],
      [92.80, 25.20],
      [92.20, 24.50],
      [90.80, 25.80],
      [89.70, 26.10]
    ]]
  }
];
