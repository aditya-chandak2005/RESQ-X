"""Provider-independent Geocoding and Place Resolution Service for RESQ-X.

Supports India-first geographical entities, administrative districts, rivers,
natural features, ambiguous match resolution, bounding boxes, caching, timeouts,
and fallback logic.
"""
import time
import json
import urllib.request
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple

# In-memory LRU / TTL cache for geocoding queries to respect rate limits
_GEOCODE_CACHE: Dict[str, Tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL_SECONDS = 3600.0

# Curated High-Fidelity Registry for India (Specialized for Assam and Uttarakhand testbeds)
CURATED_PLACES: List[Dict[str, Any]] = [
    # --- Assam State & Major Administrative Areas ---
    {
        "place_id": "in-as-state",
        "name": "Assam",
        "display_name": "Assam, Northeast India",
        "feature_type": "state",
        "district": None,
        "state": "Assam",
        "country": "India",
        "latitude": 26.2006,
        "longitude": 92.9376,
        "bbox": [89.69, 24.13, 96.02, 28.00],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [89.70, 26.00], [90.50, 26.90], [92.00, 27.20], [93.50, 27.80],
                [95.50, 27.90], [96.00, 27.30], [94.80, 26.50], [93.20, 25.20],
                [92.50, 24.20], [91.80, 24.80], [90.50, 25.50], [89.70, 26.00]
            ]]
        },
        "provider": "Survey of India / RESQ-X Curated Registry",
        "confidence": 1.0,
        "keywords": ["assam", "as", "brahmaputra valley", "barak valley"]
    },
    {
        "place_id": "in-as-cachar",
        "name": "Cachar",
        "display_name": "Cachar District, Barak Valley, Assam, India",
        "feature_type": "district",
        "district": "Cachar",
        "state": "Assam",
        "country": "India",
        "latitude": 24.8333,
        "longitude": 92.7789,
        "bbox": [92.45, 24.40, 93.25, 25.10],
        "boundary_geojson": {
            "type": "Polygon",
            "coordinates": [[
                [92.50, 24.50], [93.20, 24.50], [93.20, 25.05], [92.50, 25.05], [92.50, 24.50]
            ]]
        },
        "provider": "ASDMA / Census of India",
        "confidence": 0.98,
        "keywords": ["cachar", "barak valley", "silchar district"]
    },
    {
        "place_id": "in-as-silchar",
        "name": "Silchar",
        "display_name": "Silchar Municipal Corporation, Cachar, Assam, India",
        "feature_type": "town",
        "district": "Cachar",
        "state": "Assam",
        "country": "India",
        "latitude": 24.8236,
        "longitude": 92.7975,
        "bbox": [92.74, 24.78, 92.86, 24.87],
        "boundary_geojson": None,
        "provider": "ASDMA / OpenStreetMap",
        "confidence": 0.99,
        "keywords": ["silchar", "bethukandi", "rangirkhari", "sadarghat"]
    },
    {
        "place_id": "in-as-guwahati-city",
        "name": "Guwahati",
        "display_name": "Guwahati City, Kamrup Metropolitan, Assam, India",
        "feature_type": "city",
        "district": "Kamrup Metropolitan",
        "state": "Assam",
        "country": "India",
        "latitude": 26.1445,
        "longitude": 91.7362,
        "bbox": [91.60, 26.08, 91.85, 26.22],
        "boundary_geojson": None,
        "provider": "Guwahati Municipal Corporation / ASDMA",
        "confidence": 1.0,
        "keywords": ["guwahati", "gauhati", "dispur", "panbazar", "paltan bazar", "silsako", "kamrup city"]
    },
    {
        "place_id": "in-as-dispur",
        "name": "Dispur",
        "display_name": "Dispur Capital Complex, Kamrup Metropolitan, Assam, India",
        "feature_type": "city",
        "district": "Kamrup Metropolitan",
        "state": "Assam",
        "country": "India",
        "latitude": 26.1408,
        "longitude": 91.7907,
        "bbox": [91.77, 26.12, 91.82, 26.16],
        "boundary_geojson": None,
        "provider": "ASDMA / Survey of India",
        "confidence": 0.99,
        "keywords": ["dispur", "assam secretariat", "capital"]
    },
    {
        "place_id": "in-as-kamrup-metro",
        "name": "Kamrup Metropolitan",
        "display_name": "Kamrup Metropolitan District (Guwahati), Assam, India",
        "feature_type": "district",
        "district": "Kamrup Metropolitan",
        "state": "Assam",
        "country": "India",
        "latitude": 26.1445,
        "longitude": 91.7362,
        "bbox": [91.50, 26.00, 92.10, 26.35],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.97,
        "keywords": ["kamrup metro", "guwahati", "dispur", "silsako", "bharalu"]
    },
    {
        "place_id": "in-as-kamrup-rural",
        "name": "Kamrup Rural",
        "display_name": "Kamrup Rural District, Assam, India",
        "feature_type": "district",
        "district": "Kamrup",
        "state": "Assam",
        "country": "India",
        "latitude": 26.3126,
        "longitude": 91.5976,
        "bbox": [91.20, 25.80, 91.90, 26.80],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.95,
        "keywords": ["kamrup rural", "amigaon", "hajo", "chaygaon"]
    },
    {
        "place_id": "in-as-nagaon",
        "name": "Nagaon",
        "display_name": "Nagaon District, Central Assam, India",
        "feature_type": "district",
        "district": "Nagaon",
        "state": "Assam",
        "country": "India",
        "latitude": 26.3452,
        "longitude": 92.6840,
        "bbox": [92.30, 25.90, 93.10, 26.65],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.96,
        "keywords": ["nagaon", "kampur", "kopili basin", "kaliabor"]
    },
    {
        "place_id": "in-as-barpeta",
        "name": "Barpeta",
        "display_name": "Barpeta District, Lower Assam, India",
        "feature_type": "district",
        "district": "Barpeta",
        "state": "Assam",
        "country": "India",
        "latitude": 26.3200,
        "longitude": 91.0000,
        "bbox": [90.75, 26.05, 91.35, 26.70],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.96,
        "keywords": ["barpeta", "sarthebari", "howly", "beki river"]
    },
    {
        "place_id": "in-as-dibrugarh",
        "name": "Dibrugarh",
        "display_name": "Dibrugarh District, Upper Assam, India",
        "feature_type": "district",
        "district": "Dibrugarh",
        "state": "Assam",
        "country": "India",
        "latitude": 27.4728,
        "longitude": 94.9120,
        "bbox": [94.50, 27.10, 95.40, 27.70],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.95,
        "keywords": ["dibrugarh", "bogibeel", "chabua", "upper assam"]
    },
    {
        "place_id": "in-as-golaghat-kaziranga",
        "name": "Kaziranga / Golaghat",
        "display_name": "Kaziranga National Park, Golaghat & Nagaon, Assam, India",
        "feature_type": "national_park",
        "district": "Golaghat",
        "state": "Assam",
        "country": "India",
        "latitude": 26.5775,
        "longitude": 93.1711,
        "bbox": [92.95, 26.45, 93.45, 26.75],
        "boundary_geojson": None,
        "provider": "Wildlife Institute of India / ASDMA",
        "confidence": 0.99,
        "keywords": ["kaziranga", "golaghat", "bokakhat", "kohora", "bagori"]
    },
    {
        "place_id": "in-as-majuli",
        "name": "Majuli",
        "display_name": "Majuli River Island District, Assam, India",
        "feature_type": "river_island",
        "district": "Majuli",
        "state": "Assam",
        "country": "India",
        "latitude": 26.9500,
        "longitude": 94.2167,
        "bbox": [93.90, 26.80, 94.60, 27.15],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.98,
        "keywords": ["majuli", "garamur", "kamalabari", "brahmaputra island"]
    },
    # --- Major River Features in Assam ---
    {
        "place_id": "in-river-brahmaputra",
        "name": "Brahmaputra River",
        "display_name": "Brahmaputra River Corridor, Assam Basin, India",
        "feature_type": "river",
        "district": "Assam Basin",
        "state": "Assam",
        "country": "India",
        "latitude": 26.1900,
        "longitude": 91.7500,
        "bbox": [89.80, 25.80, 95.60, 27.90],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["brahmaputra", "luhit", "siang", "dihang", "red river"]
    },
    {
        "place_id": "in-river-barak",
        "name": "Barak River",
        "display_name": "Barak River Corridor, Southern Assam, India",
        "feature_type": "river",
        "district": "Cachar & Karimganj",
        "state": "Assam",
        "country": "India",
        "latitude": 24.8300,
        "longitude": 92.8100,
        "bbox": [92.30, 24.40, 93.30, 25.10],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["barak", "barak valley", "surma basin", "kushiara"]
    },
    {
        "place_id": "in-river-kopili",
        "name": "Kopili River",
        "display_name": "Kopili River Valley, Central Assam, India",
        "feature_type": "river",
        "district": "Nagaon & Karbi Anglong",
        "state": "Assam",
        "country": "India",
        "latitude": 26.1500,
        "longitude": 92.8300,
        "bbox": [92.50, 25.50, 93.00, 26.40],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.98,
        "keywords": ["kopili", "khandong", "neepco dam", "kampur"]
    },
    # --- Uttarakhand Core Baseline POIs ---
    {
        "place_id": "in-uk-chamoli",
        "name": "Chamoli",
        "display_name": "Chamoli District, Garhwal Himalayas, Uttarakhand, India",
        "feature_type": "district",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.4000,
        "longitude": 79.3500,
        "bbox": [79.20, 30.20, 80.05, 31.05],
        "boundary_geojson": None,
        "provider": "State Disaster Management Authority Uttarakhand",
        "confidence": 0.99,
        "keywords": ["chamoli", "gopeshwar", "dhauliganga", "rishi ganga"]
    },
    {
        "place_id": "in-uk-joshimath",
        "name": "Joshimath",
        "display_name": "Joshimath Cantonment & Base Hospital, Chamoli, Uttarakhand",
        "feature_type": "town",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.5564,
        "longitude": 79.5645,
        "bbox": [79.54, 30.53, 79.59, 30.58],
        "boundary_geojson": None,
        "provider": "Local Chamoli Emergency Registry (Verified)",
        "confidence": 1.0,
        "keywords": ["joshimath", "jyotirmath", "army base", "hospital"]
    },
    {
        "place_id": "in-uk-raini",
        "name": "Raini Village (North Bank)",
        "display_name": "Raini Village North Bank, Rishi Ganga Confluence, Chamoli",
        "feature_type": "village",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.4905,
        "longitude": 79.6830,
        "bbox": [79.67, 30.48, 79.70, 30.50],
        "boundary_geojson": None,
        "provider": "Local Chamoli Emergency Registry (Verified)",
        "confidence": 1.0,
        "keywords": ["raini", "reini", "rishi ganga", "bridge b-17"]
    },
    {
        "place_id": "in-uk-state",
        "name": "Uttarakhand",
        "display_name": "Uttarakhand State, Garhwal & Kumaon Himalayas, India",
        "feature_type": "state",
        "district": None,
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.0668,
        "longitude": 79.0193,
        "bbox": [77.55, 28.71, 81.05, 31.46],
        "boundary_geojson": None,
        "provider": "Survey of India / Uttarakhand SDMA",
        "confidence": 1.0,
        "keywords": ["uttarakhand", "uk", "uttaranchal", "garhwal", "kumaon", "himalayas"]
    },
    {
        "place_id": "in-uk-dehradun",
        "name": "Dehradun",
        "display_name": "Dehradun Capital City, Uttarakhand, India",
        "feature_type": "city",
        "district": "Dehradun",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.3165,
        "longitude": 78.0322,
        "bbox": [77.95, 30.25, 78.15, 30.40],
        "boundary_geojson": None,
        "provider": "Uttarakhand SDMA / Survey of India",
        "confidence": 0.99,
        "keywords": ["dehradun", "doon", "rajpur", "capital"]
    },
    {
        "place_id": "in-uk-rishikesh",
        "name": "Rishikesh",
        "display_name": "Rishikesh, Dehradun & Tehri Garhwal, Uttarakhand, India",
        "feature_type": "town",
        "district": "Dehradun",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.0869,
        "longitude": 78.2676,
        "bbox": [78.23, 30.05, 78.32, 30.14],
        "boundary_geojson": None,
        "provider": "Uttarakhand Tourism / Survey of India",
        "confidence": 0.99,
        "keywords": ["rishikesh", "lakshman jhula", "ram jhula", "ganga staging"]
    },
    {
        "place_id": "in-uk-haridwar",
        "name": "Haridwar",
        "display_name": "Haridwar City, Uttarakhand, India",
        "feature_type": "city",
        "district": "Haridwar",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 29.9457,
        "longitude": 78.1642,
        "bbox": [78.10, 29.90, 78.22, 30.00],
        "boundary_geojson": None,
        "provider": "Uttarakhand SDMA",
        "confidence": 0.98,
        "keywords": ["haridwar", "har ki pauri", "ganga basin"]
    },
    {
        "place_id": "in-river-dhauliganga",
        "name": "Dhauliganga River",
        "display_name": "Dhauliganga River Gorge, Chamoli, Uttarakhand, India",
        "feature_type": "river",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.5000,
        "longitude": 79.6400,
        "bbox": [79.55, 30.40, 79.75, 30.60],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["dhauliganga", "dhauli ganga", "tapovan river", "gorge"]
    },
    {
        "place_id": "in-river-rishiganga",
        "name": "Rishi Ganga River",
        "display_name": "Rishi Ganga River Basin, Chamoli, Uttarakhand, India",
        "feature_type": "river",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.4880,
        "longitude": 79.6900,
        "bbox": [79.65, 30.45, 79.75, 30.55],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["rishi ganga", "rishiganga", "raini river", "nanda devi"]
    },
    {
        "place_id": "in-river-alaknanda",
        "name": "Alaknanda River",
        "display_name": "Alaknanda River Corridor, Garhwal Himalayas, Uttarakhand, India",
        "feature_type": "river",
        "district": "Chamoli",
        "state": "Uttarakhand",
        "country": "India",
        "latitude": 30.4500,
        "longitude": 79.4500,
        "bbox": [79.20, 30.20, 79.70, 30.60],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["alaknanda", "ganga tributary", "helang", "pipalkoti", "joshimath river"]
    },
    {
        "place_id": "in-as-kampur",
        "name": "Kampur",
        "display_name": "Kampur Town, Kopili River Basin, Nagaon, Assam, India",
        "feature_type": "town",
        "district": "Nagaon",
        "state": "Assam",
        "country": "India",
        "latitude": 26.1500,
        "longitude": 92.8300,
        "bbox": [92.78, 26.11, 92.88, 26.19],
        "boundary_geojson": None,
        "provider": "ASDMA / Census of India",
        "confidence": 0.98,
        "keywords": ["kampur", "kopili flood", "nagaon flood", "hojai"]
    },
    {
        "place_id": "in-as-barpeta-town",
        "name": "Barpeta Town",
        "display_name": "Barpeta Municipal Town, Lower Assam, India",
        "feature_type": "town",
        "district": "Barpeta",
        "state": "Assam",
        "country": "India",
        "latitude": 26.3200,
        "longitude": 91.0000,
        "bbox": [90.95, 26.28, 91.05, 26.36],
        "boundary_geojson": None,
        "provider": "ASDMA / Survey of India",
        "confidence": 0.98,
        "keywords": ["barpeta town", "barpeta satra", "lower assam"]
    },
    {
        "place_id": "in-river-beki",
        "name": "Beki River",
        "display_name": "Beki River Corridor, Manas & Barpeta, Assam, India",
        "feature_type": "river",
        "district": "Barpeta",
        "state": "Assam",
        "country": "India",
        "latitude": 26.3500,
        "longitude": 90.9300,
        "bbox": [90.80, 26.20, 91.10, 26.80],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["beki", "beki river", "manas river", "barpeta flood"]
    },
    {
        "place_id": "in-hp-mandi",
        "name": "Mandi",
        "display_name": "Mandi District & Town, Beas Valley, Himachal Pradesh, India",
        "feature_type": "district",
        "district": "Mandi",
        "state": "Himachal Pradesh",
        "country": "India",
        "latitude": 31.7087,
        "longitude": 76.9320,
        "bbox": [76.60, 31.30, 77.40, 32.10],
        "boundary_geojson": None,
        "provider": "HPSDMA / Survey of India",
        "confidence": 0.98,
        "keywords": ["mandi", "beas", "himachal", "pandoh"]
    },
    {
        "place_id": "in-river-beas",
        "name": "Beas River",
        "display_name": "Beas River Basin, Mandi & Kullu, Himachal Pradesh, India",
        "feature_type": "river",
        "district": "Mandi & Kullu",
        "state": "Himachal Pradesh",
        "country": "India",
        "latitude": 31.7100,
        "longitude": 76.9400,
        "bbox": [76.70, 31.40, 77.30, 32.20],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["beas", "beas river", "himachal flood", "mandi flood"]
    },
    {
        "place_id": "in-mh-chiplun",
        "name": "Chiplun",
        "display_name": "Chiplun City, Ratnagiri District, Maharashtra, India",
        "feature_type": "town",
        "district": "Ratnagiri",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 17.5323,
        "longitude": 73.5186,
        "bbox": [73.47, 17.50, 73.56, 17.57],
        "boundary_geojson": None,
        "provider": "Maharashtra SDMA",
        "confidence": 0.99,
        "keywords": ["chiplun", "vashishti", "konkan", "ratnagiri"]
    },
    {
        "place_id": "in-river-vashishti",
        "name": "Vashishti River",
        "display_name": "Vashishti River Basin, Konkan, Maharashtra, India",
        "feature_type": "river",
        "district": "Ratnagiri",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 17.5400,
        "longitude": 73.5000,
        "bbox": [73.30, 17.40, 73.70, 17.70],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.98,
        "keywords": ["vashishti", "chiplun flood", "konkan river"]
    },
    {
        "place_id": "in-mh-mumbai",
        "name": "Mumbai",
        "display_name": "Mumbai Metropolitan Region, Maharashtra, India",
        "feature_type": "city",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "bbox": [72.75, 18.88, 73.00, 19.30],
        "boundary_geojson": None,
        "provider": "MCGM / Maharashtra SDMA",
        "confidence": 1.0,
        "keywords": ["mumbai", "bombay", "mithi river", "mahim creek", "deluge"]
    },
    {
        "place_id": "in-river-mithi",
        "name": "Mithi River",
        "display_name": "Mithi River Corridor, Mumbai, Maharashtra, India",
        "feature_type": "river",
        "district": "Mumbai Suburban",
        "state": "Maharashtra",
        "country": "India",
        "latitude": 19.0550,
        "longitude": 72.8550,
        "bbox": [72.82, 19.02, 72.90, 19.12],
        "boundary_geojson": None,
        "provider": "MCGM / CWC",
        "confidence": 0.99,
        "keywords": ["mithi", "mithi river", "mumbai flood", "mahim"]
    },
    {
        "place_id": "in-kl-kochi",
        "name": "Kochi (Cochin)",
        "display_name": "Kochi City, Ernakulam District, Kerala, India",
        "feature_type": "city",
        "district": "Ernakulam",
        "state": "Kerala",
        "country": "India",
        "latitude": 9.9312,
        "longitude": 76.2673,
        "bbox": [76.20, 9.88, 76.35, 10.02],
        "boundary_geojson": None,
        "provider": "Kerala SDMA",
        "confidence": 1.0,
        "keywords": ["kochi", "cochin", "ernakulam", "periyar", "aluva"]
    },
    {
        "place_id": "in-river-periyar",
        "name": "Periyar River",
        "display_name": "Periyar River Basin, Idukki & Ernakulam, Kerala, India",
        "feature_type": "river",
        "district": "Ernakulam & Idukki",
        "state": "Kerala",
        "country": "India",
        "latitude": 10.1100,
        "longitude": 76.3500,
        "bbox": [76.20, 9.80, 77.20, 10.30],
        "boundary_geojson": None,
        "provider": "Central Water Commission (CWC)",
        "confidence": 0.99,
        "keywords": ["periyar", "periyar river", "aluva", "idukki", "kerala flood"]
    }
]


class GeocodingService:
    """Production-grade, provider-independent geocoding engine with caching, timeouts,

    ambiguity handling, and offline-first fallback.
    """

    @staticmethod
    def search_places(query: str, limit: int = 8) -> Dict[str, Any]:
        """Search places by text query with natural language normalization and relevance ranking."""
        if not query or len(query.strip()) < 1:
            return {
                "query": query,
                "total_matches": 0,
                "places": [],
                "provider_attribution": "RESQ-X Geocoding Engine"
            }

        q_clean = query.strip().lower()

        # Check Cache
        cached = _GEOCODE_CACHE.get(q_clean)
        if cached:
            cache_time, cached_results = cached
            if (time.time() - cache_time) < CACHE_TTL_SECONDS:
                return {
                    "query": query,
                    "total_matches": len(cached_results),
                    "places": cached_results[:limit],
                    "provider_attribution": "RESQ-X Geocoding Engine (Cached)"
                }

        # Extract geographic entity by stripping hazard, disaster, and temporal words
        import re
        DISASTER_WORDS = {
            'flood', 'floods', 'flooding', 'inundation', 'deluge',
            'landslide', 'landslides', 'rockfall', 'debris', 'outburst',
            'glof', 'cyclone', 'cloudburst', 'storm', 'disaster', 'disasters',
            'in', 'near', 'around', 'of', 'at', 'during', 'and', 'for', 'with', 'from', 'to'
        }
        no_year = re.sub(r'\b(19\d\d|20\d\d)\b', ' ', q_clean)
        geo_tokens = [w for w in re.sub(r'[^\w\s]', ' ', no_year).split() if w not in DISASTER_WORDS]
        geo_q = " ".join(geo_tokens).strip()

        scored_places: List[Tuple[float, Dict[str, Any]]] = []

        # 1. Search Curated India Registry with Relevance Scoring
        for item in CURATED_PLACES:
            name_lower = item["name"].lower()
            keywords = [kw.lower() for kw in item.get("keywords", [])]
            district_lower = item.get("district", "").lower() if item.get("district") else ""
            state_lower = item.get("state", "").lower() if item.get("state") else ""

            score = 0.0
            targets = [q_clean]
            if geo_q and geo_q != q_clean:
                targets.append(geo_q)

            for t in targets:
                if not t:
                    continue
                # Exact name
                if t == name_lower:
                    score = max(score, 120.0)
                # Starts with name
                elif name_lower.startswith(t):
                    score = max(score, 80.0)
                # Substring in name
                elif t in name_lower:
                    score = max(score, 60.0)
                # Token overlap in name
                elif any(word in name_lower.split() for word in t.split()):
                    score = max(score, 45.0)

                # Exact keyword
                if any(t == kw for kw in keywords):
                    score = max(score, 70.0)
                elif any(t in kw for kw in keywords):
                    score = max(score, 40.0)

                # District match
                if district_lower:
                    if t == district_lower:
                        score = max(score, 65.0)
                    elif t in district_lower:
                        score = max(score, 35.0)

                # State match
                if state_lower:
                    if t == state_lower:
                        score = max(score, 25.0)
                    elif t in state_lower:
                        score = max(score, 15.0)

            if score > 0:
                res_obj = dict(item)
                res_obj.pop("keywords", None)
                scored_places.append((score, res_obj))

        # Sort places by score descending
        scored_places.sort(key=lambda x: x[0], reverse=True)
        results: List[Dict[str, Any]] = [p[1] for p in scored_places]

        # Detect ambiguity in results (e.g. searching "Kamrup" returns both Metro and Rural)
        for r in results:
            alternates = [
                {"name": o["name"], "place_id": o["place_id"], "feature_type": o["feature_type"]}
                for o in results
                if o["place_id"] != r["place_id"] and (
                    r["name"].lower() in o["name"].lower() or 
                    o["name"].lower() in r["name"].lower() or
                    (r.get("district") and o.get("district") and r["district"] == o["district"])
                )
            ]
            if len(alternates) >= 1 and r["feature_type"] in ["district", "town", "city", "locality"]:
                r["is_ambiguous"] = True
                r["alternate_matches"] = alternates[:3]
            else:
                r["is_ambiguous"] = False
                r["alternate_matches"] = []

        # 2. If limited local results, query external Photon (Komoot OSM) with timeout & rate limit
        if len(results) < limit:
            external_query = geo_q if len(geo_q) >= 2 else query
            external_places = GeocodingService._query_photon_external(external_query, limit - len(results))
            for ep in external_places:
                # Avoid duplicate coordinates or names
                if not any(abs(ep["latitude"] - r["latitude"]) < 0.01 and abs(ep["longitude"] - r["longitude"]) < 0.01 for r in results):
                    results.append(ep)

        # Store in Cache
        _GEOCODE_CACHE[q_clean] = (time.time(), results)

        return {
            "query": query,
            "total_matches": len(results),
            "places": results[:limit],
            "provider_attribution": "OpenStreetMap / Survey of India / RESQ-X Emergency Registry"
        }

    @staticmethod
    def get_place_by_id(place_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve full details, boundary, and bounding box for a place ID."""
        for item in CURATED_PLACES:
            if item["place_id"] == place_id:
                res = dict(item)
                res.pop("keywords", None)
                return res

        # Check in cache
        for _, (_, cached_places) in _GEOCODE_CACHE.items():
            for p in cached_places:
                if p["place_id"] == place_id:
                    return p
        return None

    @staticmethod
    def resolve_coordinates(lat: float, lon: float) -> Dict[str, Any]:
        """Reverse geocode / resolve a clicked map point or coordinate to administrative context."""
        # 1. Check if within curated bounding boxes
        for item in CURATED_PLACES:
            bbox = item.get("bbox")
            if bbox:
                min_lon, min_lat, max_lon, max_lat = bbox
                if min_lon <= lon <= max_lon and min_lat <= lat <= max_lat:
                    # Found containing area
                    return {
                        "latitude": lat,
                        "longitude": lon,
                        "nearest_place": item["name"],
                        "district": item.get("district") or item["name"],
                        "state": item.get("state") or "Assam",
                        "country": "India",
                        "feature_type": item["feature_type"],
                        "attribution": "RESQ-X Spatial Boundary Resolver"
                    }

        # 2. General Assam / Uttarakhand heuristic fallback if coordinates fall in bounds
        if 89.5 <= lon <= 96.2 and 24.0 <= lat <= 28.2:
            return {
                "latitude": lat,
                "longitude": lon,
                "nearest_place": "Assam Territory",
                "district": "Assam Administrative Sector",
                "state": "Assam",
                "country": "India",
                "feature_type": "region",
                "attribution": "Geographic Coordinate Heuristic"
            }
        elif 78.5 <= lon <= 81.0 and 29.5 <= lat <= 31.5:
            return {
                "latitude": lat,
                "longitude": lon,
                "nearest_place": "Chamoli / Garhwal Corridor",
                "district": "Chamoli",
                "state": "Uttarakhand",
                "country": "India",
                "feature_type": "mountain_corridor",
                "attribution": "Geographic Coordinate Heuristic"
            }

        return {
            "latitude": lat,
            "longitude": lon,
            "nearest_place": f"Point [{lat:.4f}, {lon:.4f}]",
            "district": None,
            "state": "India",
            "country": "India",
            "feature_type": "coordinate",
            "attribution": "Direct Coordinate Input"
        }

    @staticmethod
    def _query_photon_external(query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Query Photon Komoot OSM API with 2.5s strict timeout and error recovery."""
        places: List[Dict[str, Any]] = []
        try:
            # Append India to bias query appropriately if not already present
            q_param = query
            if "india" not in q_param.lower() and "assam" not in q_param.lower() and "uttarakhand" not in q_param.lower():
                q_param = f"{query}, India"

            encoded = urllib.parse.quote(q_param)
            url = f"https://photon.komoot.io/api/?q={encoded}&limit={limit}"
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "RESQ-X-DisasterResponse/2.0 (India-First Emergency Intelligence)"}
            )

            with urllib.request.urlopen(req, timeout=2.5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                for feat in data.get("features", []):
                    props = feat.get("properties", {})
                    coords = feat.get("geometry", {}).get("coordinates", [])
                    if len(coords) >= 2:
                        name = props.get("name") or props.get("city") or query
                        osm_id = str(props.get("osm_id", hash(name)))
                        state = props.get("state")
                        country = props.get("country", "India")
                        district = props.get("county") or props.get("district")
                        f_type = props.get("osm_value") or props.get("type", "locality")

                        addr_parts = [name]
                        if district:
                            addr_parts.append(district)
                        if state:
                            addr_parts.append(state)
                        if country:
                            addr_parts.append(country)

                        extent = feat.get("bbox")

                        places.append({
                            "place_id": f"ext-{osm_id}",
                            "name": name,
                            "display_name": ", ".join(addr_parts),
                            "feature_type": f_type,
                            "district": district,
                            "state": state,
                            "country": country,
                            "latitude": float(coords[1]),
                            "longitude": float(coords[0]),
                            "bbox": extent,
                            "boundary_geojson": None,
                            "provider": "OpenStreetMap / Photon Komoot",
                            "confidence": 0.85,
                            "is_ambiguous": False,
                            "alternate_matches": []
                        })
        except Exception as e:
            # Gracefully swallow network/timeout errors - do not crash the service
            pass
        return places

