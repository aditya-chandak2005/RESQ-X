"""Common Alerting Protocol (CAP v1.2) & India CAP / NDMA SACHET Parser.

Provides robust parsing for CAP XML feeds, RSS enclosures, coordinate extraction,
GeoJSON polygon normalization, and administrative bounding geometry.
"""
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import re

# Standard CAP namespaces
CAP_NAMESPACES = {
    "cap": "urn:oasis:names:tc:emergency:cap:1.2",
    "atom": "http://www.w3.org/2005/Atom"
}


class CapParser:
    """Parser for Common Alerting Protocol documents from NDMA SACHET & Indian authorities."""

    @staticmethod
    def parse_cap_xml(xml_content: str) -> List[Dict[str, Any]]:
        """Parse raw CAP XML string into structured alert dictionaries."""
        alerts: List[Dict[str, Any]] = []
        try:
            # Strip namespaces from tags for easier traversal if namespaces vary
            cleaned_xml = re.sub(r'\sxmlns(:\w+)?="[^"]+"', '', xml_content, count=1)
            root = ET.fromstring(cleaned_xml)
        except Exception as e:
            # If standard parsing fails, return empty list
            return alerts

        # Check if root is <alert> or an <rss> / <feed> container
        alert_nodes = [root] if root.tag.endswith("alert") else root.findall(".//alert")
        if not alert_nodes:
            # Try finding entry nodes with embedded alert
            alert_nodes = root.findall(".//entry")

        for alert_node in alert_nodes:
            parsed = CapParser._parse_single_alert(alert_node)
            if parsed:
                alerts.append(parsed)

        return alerts

    @staticmethod
    def _parse_single_alert(node: ET.Element) -> Optional[Dict[str, Any]]:
        """Extract all standard CAP fields from an <alert> XML element."""
        def get_text(parent: ET.Element, tag: str, default: Optional[str] = None) -> Optional[str]:
            el = parent.find(tag)
            if el is None:
                # Try finding case-insensitive or ending with tag
                for child in parent:
                    if child.tag.lower().endswith(tag.lower()):
                        return (child.text or "").strip()
                return default
            return (el.text or default).strip() if el.text else default

        identifier = get_text(node, "identifier") or f"CAP-{int(datetime.utcnow().timestamp())}"
        sender = get_text(node, "sender", "NDMA SACHET")
        sent_str = get_text(node, "sent")
        status = get_text(node, "status", "Actual")
        msg_type = get_text(node, "msgType", "Alert")
        scope = get_text(node, "scope", "Public")

        sent_dt = datetime.utcnow()
        if sent_str:
            try:
                # Handle ISO timestamps with timezone offsets
                clean_ts = re.sub(r'([+-]\d{2}):(\d{2})$', r'\1\2', sent_str)
                sent_dt = datetime.fromisoformat(clean_ts.replace('Z', '+00:00')).replace(tzinfo=None)
            except Exception:
                pass

        # Information element <info>
        info_node = node.find("info") or node
        category = get_text(info_node, "category", "Met")
        event = get_text(info_node, "event", "Flood Warning")
        urgency = get_text(info_node, "urgency", "Expected")
        severity = get_text(info_node, "severity", "Severe")
        certainty = get_text(info_node, "certainty", "Observed")
        headline = get_text(info_node, "headline") or f"{event} Alert for designated sector"
        description = get_text(info_node, "description", "")
        instruction = get_text(info_node, "instruction", "Follow local disaster management guidelines and move to high ground.")
        expires_str = get_text(info_node, "expires")

        expires_dt = None
        if expires_str:
            try:
                clean_ts = re.sub(r'([+-]\d{2}):(\d{2})$', r'\1\2', expires_str)
                expires_dt = datetime.fromisoformat(clean_ts.replace('Z', '+00:00')).replace(tzinfo=None)
            except Exception:
                pass

        # Area element <area>
        area_node = info_node.find("area") or info_node
        area_desc = get_text(area_node, "areaDesc", "Designated Risk Sector")
        polygon_str = get_text(area_node, "polygon")
        circle_str = get_text(area_node, "circle")

        polygon_geojson = None
        center_lat, center_lon = None, None

        if polygon_str:
            coords = CapParser.parse_cap_polygon(polygon_str)
            if coords:
                polygon_geojson = {
                    "type": "Polygon",
                    "coordinates": [coords]
                }
                # Calculate centroid
                lats = [c[1] for c in coords]
                lons = [c[0] for c in coords]
                center_lat = sum(lats) / len(lats)
                center_lon = sum(lons) / len(lons)
        elif circle_str:
            # Circle format: "lat,lon radius_km"
            center_lat, center_lon, polygon_geojson = CapParser.parse_cap_circle(circle_str)

        # Map CAP severity to canonical alert level (RED, ORANGE, YELLOW, GREEN)
        alert_level = CapParser.map_cap_severity_to_level(severity, urgency)

        # Infer state & district from area_desc / headline
        state, district = CapParser.infer_admin_hierarchy(area_desc, headline)

        return {
            "cap_identifier": identifier,
            "sender": sender,
            "sent_at": sent_dt,
            "status": status,
            "msg_type": msg_type,
            "scope": scope,
            "category": category,
            "event_type": event,
            "urgency": urgency,
            "severity_raw": severity,
            "certainty": certainty,
            "alert_level": alert_level,
            "headline": headline,
            "description": description,
            "instruction": instruction,
            "effective_until": expires_dt,
            "area_description": area_desc,
            "polygon_geojson": polygon_geojson,
            "center_lat": center_lat,
            "center_lon": center_lon,
            "state": state,
            "district": district,
        }

    @staticmethod
    def parse_cap_polygon(polygon_str: str) -> List[List[float]]:
        """Convert CAP 'lat,lon lat,lon' string into GeoJSON [[lon, lat], ...] coordinates."""
        coords: List[List[float]] = []
        pairs = polygon_str.strip().split()
        for p in pairs:
            parts = p.split(",")
            if len(parts) == 2:
                try:
                    lat = float(parts[0].strip())
                    lon = float(parts[1].strip())
                    coords.append([lon, lat])
                except ValueError:
                    continue

        # Close polygon ring if open
        if coords and (coords[0][0] != coords[-1][0] or coords[0][1] != coords[-1][1]):
            coords.append(coords[0])

        return coords

    @staticmethod
    def parse_cap_circle(circle_str: str) -> Tuple[Optional[float], Optional[float], Optional[Dict[str, Any]]]:
        """Convert CAP 'lat,lon radius_km' into centroid and approximate 16-point circle Polygon."""
        import math
        parts = circle_str.strip().split()
        if not parts:
            return None, None, None

        lat_lon = parts[0].split(",")
        radius_km = float(parts[1]) if len(parts) > 1 else 10.0
        try:
            center_lat = float(lat_lon[0])
            center_lon = float(lat_lon[1])
        except (ValueError, IndexError):
            return None, None, None

        # Build 16-vertex polygon circle
        ring: List[List[float]] = []
        for i in range(17):
            angle = i * (2 * math.pi / 16)
            d_lat = (radius_km / 111.0) * math.cos(angle)
            d_lon = (radius_km / (111.0 * math.cos(math.radians(center_lat)))) * math.sin(angle)
            ring.append([round(center_lon + d_lon, 5), round(center_lat + d_lat, 5)])

        return center_lat, center_lon, {"type": "Polygon", "coordinates": [ring]}

    @staticmethod
    def map_cap_severity_to_level(severity: str, urgency: str = "Expected") -> str:
        """Map CAP severity/urgency into standardized disaster alert level."""
        sev = (severity or "").lower()
        urg = (urgency or "").lower()
        if sev in ["extreme"] or (sev == "severe" and urg == "immediate"):
            return "RED"
        if sev in ["severe"] or (sev == "moderate" and urg in ["immediate", "expected"]):
            return "ORANGE"
        if sev in ["moderate"]:
            return "YELLOW"
        return "GREEN"

    @staticmethod
    def infer_admin_hierarchy(area_desc: str, headline: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract Indian state and district mentions from alert text."""
        INDIAN_STATES = [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
            "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
            "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
            "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
        ]
        text = f"{area_desc} {headline}"
        found_state = None
        for s in INDIAN_STATES:
            if re.search(r'\b' + re.escape(s) + r'\b', text, re.IGNORECASE):
                found_state = s
                break

        # Check common districts
        COMMON_DISTRICTS = [
            "Chamoli", "Cachar", "Silchar", "Nagaon", "Golaghat", "Barpeta", "Kamrup", "Ratnagiri",
            "Mumbai", "Ernakulam", "Idukki", "Wayanad", "Mandi", "Kullu", "Puri", "Cuttack",
            "Patna", "Supaul", "Prayagraj", "Varanasi", "Belagavi", "Chennai", "Vadodara"
        ]
        found_district = None
        for d in COMMON_DISTRICTS:
            if re.search(r'\b' + re.escape(d) + r'\b', text, re.IGNORECASE):
                found_district = d
                break

        return found_state, found_district
