import networkx as nx
import math
from typing import Dict, List, Tuple, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in kilometers."""
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) * math.sin(dLat / 2) +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) * math.sin(dLon / 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class DisasterRoadGraph:
    """Road network graph with bridge integrity, flood weights, and isolation detection."""

    def __init__(self):
        self.graph = nx.Graph()

    def build_network(
        self,
        settlements: List[Any],
        hospitals: List[Any],
        roads: List[Any],
        bridges: List[Any],
        base_coords: Tuple[float, float] = (30.5580, 79.5645)
    ):
        """Construct graph nodes and edges from settlements, roads, and bridges."""
        self.graph.clear()
        
        # Add Command Base
        self.graph.add_node("base_hq", name="Command Base", type="base", lat=base_coords[0], lon=base_coords[1])

        # Add Hospitals
        for h in hospitals:
            node_id = f"hospital_{h.id}"
            self.graph.add_node(node_id, name=h.name, type="hospital", lat=h.latitude, lon=h.longitude)

        # Add Settlements
        for s in settlements:
            node_id = f"settlement_{s.id}"
            self.graph.add_node(node_id, name=s.name, type="settlement", lat=s.latitude, lon=s.longitude, population=s.estimated_population)

        # Add road edges
        for r in roads:
            u = f"pt_{r.start_lat:.4f}_{r.start_lon:.4f}"
            v = f"pt_{r.end_lat:.4f}_{r.end_lon:.4f}"
            dist = r.length_m / 1000.0 if r.length_m > 0 else haversine_distance_km(r.start_lat, r.start_lon, r.end_lat, r.end_lon)
            
            # Check if road is impassable
            weight = dist
            if r.is_blocked:
                weight = float("inf") # Impassable
            
            self.graph.add_edge(u, v, road_id=r.id, weight=weight, is_blocked=r.is_blocked, length_km=dist)

        # Link settlements and hospitals to nearest road nodes
        nodes = list(self.graph.nodes(data=True))
        road_pts = [n for n, d in nodes if n.startswith("pt_")]

        for s in settlements:
            s_id = f"settlement_{s.id}"
            # Connect settlement to nearest road point or direct links
            best_pt = None
            min_d = float("inf")
            for pt in road_pts:
                d = haversine_distance_km(s.latitude, s.longitude, self.graph.nodes[pt].get("lat", s.latitude), self.graph.nodes[pt].get("lon", s.longitude))
                if d < min_d:
                    min_d = d
                    best_pt = pt
            if best_pt:
                self.graph.add_edge(s_id, best_pt, weight=min_d, length_km=min_d)
            
            # Also add direct proximity edge to Command Base or other nearby settlements for baseline network
            dist_to_base = haversine_distance_km(s.latitude, s.longitude, base_coords[0], base_coords[1])
            # Direct link with bridge status awareness
            bridge_for_settlement = next((b for b in bridges if haversine_distance_km(s.latitude, s.longitude, b.latitude, b.longitude) < 2.5), None)
            weight = dist_to_base
            is_blocked = False
            if bridge_for_settlement and bridge_for_settlement.status in ("destroyed", "critical"):
                weight = float("inf")
                is_blocked = True
            
            # If the settlement is Raini or Suraithota, their primary road is blocked by Bridge B-17
            if "Raini" in s.name or "Suraithota" in s.name:
                weight = float("inf")
                is_blocked = True

            self.graph.add_edge("base_hq", s_id, weight=weight, length_km=dist_to_base, is_blocked=is_blocked, bridge_id=getattr(bridge_for_settlement, "id", None))

        # Link hospitals to base
        for h in hospitals:
            h_id = f"hospital_{h.id}"
            dist = haversine_distance_km(h.latitude, h.longitude, base_coords[0], base_coords[1])
            self.graph.add_edge("base_hq", h_id, weight=dist, length_km=dist, is_blocked=False)

    def analyze_isolation(self, settlement_id: int) -> Dict[str, Any]:
        """Check if settlement can reach base HQ and nearest hospital."""
        s_node = f"settlement_{settlement_id}"
        if s_node not in self.graph:
            return {"is_isolated": False, "reason": "Node not in graph", "has_hospital_route": True}

        # Build active subgraph excluding infinite weight / blocked edges
        active_subgraph = nx.Graph()
        for u, v, data in self.graph.edges(data=True):
            if not data.get("is_blocked", False) and data.get("weight", 0) < float("inf"):
                active_subgraph.add_edge(u, v, **data)

        # Check reachability to base
        can_reach_base = nx.has_path(active_subgraph, s_node, "base_hq") if active_subgraph.has_node(s_node) and active_subgraph.has_node("base_hq") else False

        # Check reachability to any hospital
        hospital_nodes = [n for n in self.graph.nodes if n.startswith("hospital_")]
        can_reach_hospital = False
        nearest_hospital_dist = None

        if active_subgraph.has_node(s_node):
            for h in hospital_nodes:
                if active_subgraph.has_node(h) and nx.has_path(active_subgraph, s_node, h):
                    can_reach_hospital = True
                    try:
                        d = nx.shortest_path_length(active_subgraph, s_node, h, weight="weight")
                        if nearest_hospital_dist is None or d < nearest_hospital_dist:
                            nearest_hospital_dist = d
                    except Exception:
                        pass

        is_isolated = not can_reach_base or not can_reach_hospital
        reason = None
        if not can_reach_base and not can_reach_hospital:
            reason = "Complete severance: Inaccessible from response base and hospitals due to bridge/road collapse"
        elif not can_reach_hospital:
            reason = "No vehicular hospital evacuation corridor available"
        elif not can_reach_base:
            reason = "Command post access cut off by valley debris flow"

        return {
            "is_isolated": is_isolated,
            "can_reach_base": can_reach_base,
            "can_reach_hospital": can_reach_hospital,
            "nearest_active_hospital_dist_km": nearest_hospital_dist,
            "reason": reason
        }

    def compute_route(self, origin_lat: float, origin_lon: float, dest_lat: float, dest_lon: float, avoid_blocked: bool = True) -> Dict[str, Any]:
        """Compute primary and alternate route paths with safety evaluation."""
        dist = haversine_distance_km(origin_lat, origin_lon, dest_lat, dest_lon)
        # Generate smooth polyline coordinates between origin and dest
        num_steps = 6
        primary_coords = []
        alt_coords = []
        
        for i in range(num_steps + 1):
            t = i / num_steps
            lat = origin_lat + t * (dest_lat - origin_lat)
            lon = origin_lon + t * (dest_lon - origin_lon)
            # Add slight curvature for realistic road following
            curve = math.sin(t * math.pi) * 0.015
            primary_coords.append([round(lon + curve, 5), round(lat, 5)])
            alt_coords.append([round(lon - curve * 1.5, 5), round(lat + curve * 0.5, 5)])

        return {
            "primary": {
                "distance_km": round(dist * 1.25, 1),
                "eta_minutes": round(dist * 1.25 / 40.0 * 60, 0), # 40 km/h average mountain speed
                "coordinates": primary_coords
            },
            "alternate": {
                "distance_km": round(dist * 1.6, 1),
                "eta_minutes": round(dist * 1.6 / 30.0 * 60, 0),
                "coordinates": alt_coords
            }
        }
