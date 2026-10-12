import urllib.request
import json
import os
from shapely.geometry import shape, mapping
from shapely.ops import transform

os.makedirs("data/raw", exist_ok=True)
os.makedirs("frontend/src/data", exist_ok=True)

STATE_URL = "https://raw.githubusercontent.com/geohacker/india/master/state/india_telengana.geojson"
local_state_file = "data/raw/india_states_raw.geojson"

if not os.path.exists(local_state_file):
    print("Downloading India states GeoJSON...")
    urllib.request.urlretrieve(STATE_URL, local_state_file)
    print("Downloaded states.")
else:
    print("Using cached states GeoJSON.")

with open(local_state_file, "r", encoding="utf-8") as f:
    raw_data = json.load(f)

simplified_features = []

for feat in raw_data["features"]:
    props = feat["properties"]
    name = props.get("NAME_1", "")
    if name == "Uttaranchal":
        name = "Uttarakhand"
    elif name == "Orissa":
        name = "Odisha"

    geom = shape(feat["geometry"])
    # Simplify geometry with tolerance 0.015 (~1.5 km resolution) for fast web rendering
    simplified_geom = geom.simplify(0.015, preserve_topology=True)
    
    # Calculate centroid
    centroid = geom.centroid
    
    # Priority states for disaster response
    is_disaster_hub = name in ["Assam", "Uttarakhand", "Meghalaya", "Arunachal Pradesh", "Sikkim", "West Bengal", "Bihar"]

    simplified_features.append({
        "type": "Feature",
        "properties": {
            "name": name,
            "state_code": props.get("ID_1", 0),
            "is_disaster_hub": is_disaster_hub,
            "centroid": [round(centroid.y, 4), round(centroid.x, 4)]
        },
        "geometry": mapping(simplified_geom)
    })

output_geojson = {
    "type": "FeatureCollection",
    "features": simplified_features
}

# Also define curated operational districts for Assam & Uttarakhand
operational_districts = [
    {
        "name": "Cachar District (Silchar)",
        "state": "Assam",
        "center": [24.8333, 92.7789],
        "coordinates": [
            [92.50, 24.55],
            [92.65, 24.50],
            [93.15, 24.60],
            [93.20, 24.85],
            [93.05, 25.08],
            [92.80, 25.10],
            [92.60, 24.95],
            [92.50, 24.75],
            [92.50, 24.55]
        ]
    },
    {
        "name": "Kamrup Metropolitan (Guwahati)",
        "state": "Assam",
        "center": [26.1445, 91.7362],
        "coordinates": [
            [91.55, 26.05],
            [91.95, 26.02],
            [92.05, 26.20],
            [91.80, 26.30],
            [91.60, 26.22],
            [91.55, 26.05]
        ]
    },
    {
        "name": "Chamoli District (Raini/Joshimath)",
        "state": "Uttarakhand",
        "center": [30.4950, 79.6200],
        "coordinates": [
            [79.25, 30.15],
            [79.55, 30.05],
            [79.95, 30.25],
            [80.05, 30.75],
            [79.80, 31.05],
            [79.40, 30.90],
            [79.20, 30.55],
            [79.25, 30.15]
        ]
    },
    {
        "name": "Nagaon District (Kopili Basin)",
        "state": "Assam",
        "center": [26.3450, 92.6840],
        "coordinates": [
            [92.35, 26.15],
            [92.70, 26.05],
            [93.05, 26.25],
            [92.95, 26.55],
            [92.55, 26.60],
            [92.35, 26.15]
        ]
    },
    {
        "name": "Golaghat District (Kaziranga)",
        "state": "Assam",
        "center": [26.5200, 93.9700],
        "coordinates": [
            [93.45, 26.35],
            [93.85, 26.20],
            [94.15, 26.50],
            [94.00, 26.80],
            [93.50, 26.75],
            [93.45, 26.35]
        ]
    }
]

# Write TypeScript file
ts_content = f"""// Auto-generated simplified Indian States & Districts GeoJSON for RESQ-X Tactical Map
export interface StateFeature {{
  type: string;
  properties: {{
    name: string;
    state_code: number;
    is_disaster_hub: boolean;
    centroid: [number, number];
  }};
  geometry: {{
    type: string;
    coordinates: any;
  }};
}}

export interface DistrictBoundary {{
  name: string;
  state: string;
  center: [number, number];
  coordinates: [number, number][]; // [lon, lat]
}}

export const INDIA_STATE_BOUNDARIES_GEOJSON = {json.dumps(output_geojson, indent=2)};

export const OPERATIONAL_DISTRICTS: DistrictBoundary[] = {json.dumps(operational_districts, indent=2)};
"""

with open("frontend/src/data/indiaStateBoundaries.ts", "w", encoding="utf-8") as f:
    f.write(ts_content)

print(f"Successfully generated frontend/src/data/indiaStateBoundaries.ts with {len(simplified_features)} states and {len(operational_districts)} districts!")
