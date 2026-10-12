import datetime
from backend.app.db.session import engine, SessionLocal
from backend.app.db.base import Base
from backend.app.models.models import (
    DisasterEvent,
    SatelliteScene,
    FloodResult,
    FloodPolygon,
    Settlement,
    InfrastructureAsset,
    RoadSegment,
    Bridge,
    RescuePriority,
    Resource,
    RescueTeam,
    Mission,
    Route,
)

def init_database():
    """Create all database tables and seed baseline demo disaster data."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Check if baseline disaster already exists
    existing = db.query(DisasterEvent).filter(DisasterEvent.name == "Chamoli Flash Flood & Outburst").first()
    if existing:
        db.close()
        return existing.id

    # 1. Create Core Disaster Event
    disaster = DisasterEvent(
        name="Chamoli Flash Flood & Outburst",
        disaster_type="glacial_lake_flash_flood",
        status="active",
        description="High-velocity glacial outburst and flash flood along the Dhauliganga and Alaknanda river basins causing extensive bridge washouts, road severances, and cutting off upper valley settlements.",
        incident_date=datetime.datetime(2026, 2, 7, 10, 21),
        center_lat=30.4850,
        center_lon=79.6200,
        aoi_geojson={
            "type": "Polygon",
            "coordinates": [[
                [79.4500, 30.3800],
                [79.8000, 30.3800],
                [79.8000, 30.6500],
                [79.4500, 30.6500],
                [79.4500, 30.3800]
            ]]
        }
    )
    db.add(disaster)
    db.commit()
    db.refresh(disaster)
    d_id = disaster.id

    # 2. Satellite Scenes (Pre- and Post-event Sentinel-1 SAR & Sentinel-2 Optical)
    scenes = [
        SatelliteScene(
            disaster_id=d_id,
            satellite_name="Sentinel-1 SAR",
            sensor_type="C-SAR / Interferometric Wide Swath",
            acquisition_date=datetime.datetime(2026, 2, 3, 5, 45),
            is_pre_event=True,
            cloud_coverage_pct=0.0,
            resolution_m=10.0,
            scene_identifier="S1A_IW_GRDH_1SDV_20260203T054522_PRE_CHAMOLI",
            raw_bands={"polarization": "VV+VH", "orbit": "Descending"}
        ),
        SatelliteScene(
            disaster_id=d_id,
            satellite_name="Sentinel-1 SAR",
            sensor_type="C-SAR / Interferometric Wide Swath",
            acquisition_date=datetime.datetime(2026, 2, 7, 17, 30),
            is_pre_event=False,
            cloud_coverage_pct=0.0,
            resolution_m=10.0,
            scene_identifier="S1A_IW_GRDH_1SDV_20260207T173010_POST_CHAMOLI",
            raw_bands={"polarization": "VV+VH", "orbit": "Ascending"}
        ),
        SatelliteScene(
            disaster_id=d_id,
            satellite_name="Sentinel-2 Optical",
            sensor_type="MSI MultiSpectral",
            acquisition_date=datetime.datetime(2026, 2, 8, 10, 15),
            is_pre_event=False,
            cloud_coverage_pct=14.2,
            resolution_m=10.0,
            scene_identifier="S2B_MSIL2A_20260208T101501_N0500_R019",
            raw_bands={"b4": "Red", "b3": "Green", "b2": "Blue", "b8": "NIR", "b11": "SWIR"}
        )
    ]
    db.add_all(scenes)

    # 3. Flood Result & Polygons (AI-segmented extent along river corridor)
    flood_res = FloodResult(
        disaster_id=d_id,
        analysis_timestamp=datetime.datetime.utcnow(),
        model_name="RESQ-Net-SARv2 (Kuro-Siwo Fine-tuned)",
        model_version="2.1.0-prod",
        confidence_score=0.912,
        total_flooded_area_sqkm=42.8,
        severity_breakdown={"critical": 14.6, "high": 18.2, "medium": 7.3, "low": 2.7},
        validation_iou=0.854,
        validation_f1=0.918
    )
    db.add(flood_res)
    db.commit()
    db.refresh(flood_res)

    polygons = [
        # Upper Gorge Critical Flood Zone
        FloodPolygon(
            flood_result_id=flood_res.id,
            disaster_id=d_id,
            severity="critical",
            depth_estimate_m=4.8,
            confidence=0.94,
            area_sqm=14600000.0,
            geometry_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [79.670, 30.550], [79.720, 30.540], [79.735, 30.510],
                    [79.705, 30.490], [79.660, 30.520], [79.670, 30.550]
                ]]
            }
        ),
        # Tapovan Hydro Plant & Mid-Stream Zone
        FloodPolygon(
            flood_result_id=flood_res.id,
            disaster_id=d_id,
            severity="high",
            depth_estimate_m=2.9,
            confidence=0.89,
            area_sqm=18200000.0,
            geometry_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [79.610, 30.505], [79.650, 30.500], [79.660, 30.470],
                    [79.620, 30.450], [79.590, 30.480], [79.610, 30.505]
                ]]
            }
        ),
        # Lower Joshimath Outskirts Spread
        FloodPolygon(
            flood_result_id=flood_res.id,
            disaster_id=d_id,
            severity="medium",
            depth_estimate_m=1.3,
            confidence=0.84,
            area_sqm=7300000.0,
            geometry_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [79.540, 30.460], [79.580, 30.450], [79.575, 30.420],
                    [79.525, 30.430], [79.540, 30.460]
                ]]
            }
        ),
        # Downstream Buffer
        FloodPolygon(
            flood_result_id=flood_res.id,
            disaster_id=d_id,
            severity="low",
            depth_estimate_m=0.6,
            confidence=0.78,
            area_sqm=2700000.0,
            geometry_geojson={
                "type": "Polygon",
                "coordinates": [[
                    [79.490, 30.410], [79.520, 30.405], [79.510, 30.385],
                    [79.480, 30.390], [79.490, 30.410]
                ]]
            }
        ),
    ]
    db.add_all(polygons)

    # 4. Settlements
    settlements = [
        Settlement(
            disaster_id=d_id,
            name="Raini Village",
            settlement_type="village",
            estimated_population=480,
            population_source="Census 2021 + OSM Building density",
            latitude=30.4912,
            longitude=79.6841,
            elevation_m=1980.0,
            is_isolated=True,
            isolation_reason="Main access bridge B-17 destroyed; access road inundated with debris",
            nearest_hospital_name="Joshimath District Hospital",
            nearest_hospital_dist_km=21.4,
            nearest_town_dist_km=18.6,
            connectivity_status="severed",
            flood_severity_exposure="critical"
        ),
        Settlement(
            disaster_id=d_id,
            name="Tapovan Settlement",
            settlement_type="village",
            estimated_population=1250,
            population_source="Census 2021 + Local Hydro Project Staff",
            latitude=30.4945,
            longitude=79.6278,
            elevation_m=1820.0,
            is_isolated=True,
            isolation_reason="Tunnel access blocked; NH-58 link severed by high water torrents",
            nearest_hospital_name="Joshimath District Hospital",
            nearest_hospital_dist_km=14.2,
            nearest_town_dist_km=12.0,
            connectivity_status="severed",
            flood_severity_exposure="high"
        ),
        Settlement(
            disaster_id=d_id,
            name="Joshimath Upper Cantt",
            settlement_type="town",
            estimated_population=16700,
            population_source="Urban Local Body Records",
            latitude=30.5580,
            longitude=79.5645,
            elevation_m=1890.0,
            is_isolated=False,
            isolation_reason=None,
            nearest_hospital_name="Joshimath District Hospital",
            nearest_hospital_dist_km=1.2,
            nearest_town_dist_km=0.0,
            connectivity_status="normal",
            flood_severity_exposure="low"
        ),
        Settlement(
            disaster_id=d_id,
            name="Suraithota",
            settlement_type="hamlet",
            estimated_population=320,
            population_source="Census 2021",
            latitude=30.5284,
            longitude=79.7431,
            elevation_m=2150.0,
            is_isolated=True,
            isolation_reason="Border Roads link washed away at km 38",
            nearest_hospital_name="Joshimath District Hospital",
            nearest_hospital_dist_km=28.5,
            nearest_town_dist_km=26.0,
            connectivity_status="severed",
            flood_severity_exposure="critical"
        ),
        Settlement(
            disaster_id=d_id,
            name="Helang Riverbank Settlement",
            settlement_type="village",
            estimated_population=640,
            population_source="OSM Building Census",
            latitude=30.5180,
            longitude=79.5100,
            elevation_m=1450.0,
            is_isolated=False,
            isolation_reason=None,
            nearest_hospital_name="Pipalkoti Community Health Centre",
            nearest_hospital_dist_km=8.4,
            nearest_town_dist_km=7.5,
            connectivity_status="impaired",
            flood_severity_exposure="medium"
        ),
    ]
    db.add_all(settlements)
    db.commit()

    # Re-fetch settlements to link with priorities
    saved_settlements = db.query(Settlement).filter(Settlement.disaster_id == d_id).all()
    settlement_map = {s.name: s for s in saved_settlements}

    # 5. Rescue Priorities (Transparent explainable scoring)
    priorities = [
        RescuePriority(
            disaster_id=d_id,
            settlement_id=settlement_map["Raini Village"].id,
            priority_score=94.5,
            priority_level="CRITICAL",
            flood_severity_factor=25.0,
            population_factor=18.5,
            connectivity_loss_factor=25.0,
            hospital_accessibility_factor=16.0,
            route_availability_factor=10.0,
            explanations=[
                "Direct flash flood impact along Dhauliganga gorge (Severity: Critical)",
                "Complete road & bridge severance (Bridge B-17 washed out)",
                "Zero vehicular hospital access to Joshimath District Hospital (21.4 km)",
                "Estimated 480 civilians trapped without clean water supply",
                "High risk of subsequent landslides along unstable valley slopes"
            ]
        ),
        RescuePriority(
            disaster_id=d_id,
            settlement_id=settlement_map["Tapovan Settlement"].id,
            priority_score=88.0,
            priority_level="CRITICAL",
            flood_severity_factor=24.0,
            population_factor=23.0,
            connectivity_loss_factor=22.0,
            hospital_accessibility_factor=11.0,
            route_availability_factor=8.0,
            explanations=[
                "Major industrial & worker settlement impacted by flash flood surge",
                "Hydroelectric tunnel workers trapped in silt accumulation zone",
                "Primary link road inundated; alternate foot trail precarious",
                "Immediate medical air-evacuation or technical boat rescue needed"
            ]
        ),
        RescuePriority(
            disaster_id=d_id,
            settlement_id=settlement_map["Suraithota"].id,
            priority_score=78.2,
            priority_level="HIGH",
            flood_severity_factor=21.0,
            population_factor=12.0,
            connectivity_loss_factor=25.0,
            hospital_accessibility_factor=12.0,
            route_availability_factor=8.2,
            explanations=[
                "High-altitude border settlement completely cut off",
                "No overland supply route available; nearest hospital > 28 km",
                "Elderly and vulnerable population requires food & medical airdrop"
            ]
        ),
        RescuePriority(
            disaster_id=d_id,
            settlement_id=settlement_map["Helang Riverbank Settlement"].id,
            priority_score=56.4,
            priority_level="MEDIUM",
            flood_severity_factor=15.0,
            population_factor=14.4,
            connectivity_loss_factor=12.0,
            hospital_accessibility_factor=8.0,
            route_availability_factor=7.0,
            explanations=[
                "River water levels rising near perimeter, but main bridge remains intact",
                "Partial road blockages cleared by local authorities",
                "Can reach Pipalkoti Community Health Centre via secondary route"
            ]
        ),
        RescuePriority(
            disaster_id=d_id,
            settlement_id=settlement_map["Joshimath Upper Cantt"].id,
            priority_score=28.0,
            priority_level="LOW",
            flood_severity_factor=5.0,
            population_factor=10.0,
            connectivity_loss_factor=4.0,
            hospital_accessibility_factor=4.0,
            route_availability_factor=5.0,
            explanations=[
                "High elevation, zero flood water encroachment",
                "Direct walking access to Joshimath District Hospital (< 1.2 km)",
                "Currently serving as emergency staging and relief intake hub"
            ]
        ),
    ]
    db.add_all(priorities)

    # 6. Critical Bridges & Roads
    bridges = [
        Bridge(
            disaster_id=d_id,
            osm_id="way/7891244",
            name="Bridge B-17 (Raini Dhauliganga Span)",
            road_name="Joshimath-Malari Border Road",
            latitude=30.4905,
            longitude=79.6830,
            status="destroyed",
            water_clearance_m=0.0,
            confidence=0.96,
            verification_status="field_confirmed_collapsed"
        ),
        Bridge(
            disaster_id=d_id,
            osm_id="way/8192312",
            name="Tapovan Barrage Access Bridge",
            road_name="Tapovan Plant Access",
            latitude=30.4930,
            longitude=79.6260,
            status="critical",
            water_clearance_m=0.4,
            confidence=0.88,
            verification_status="sensor_submerged_alert"
        ),
        Bridge(
            disaster_id=d_id,
            osm_id="way/6541289",
            name="Helang Alaknanda Steel Suspension Bridge",
            road_name="NH-58 Main Highway",
            latitude=30.5200,
            longitude=79.5120,
            status="open",
            water_clearance_m=6.8,
            confidence=0.92,
            verification_status="field_confirmed_operational"
        ),
        Bridge(
            disaster_id=d_id,
            osm_id="way/9012371",
            name="Rishiganga Confluence Bailey Bridge",
            road_name="Raini Upper Bypass",
            latitude=30.4880,
            longitude=79.6910,
            status="destroyed",
            water_clearance_m=0.0,
            confidence=0.95,
            verification_status="satellite_loss_detected"
        ),
    ]
    db.add_all(bridges)

    # Roads
    roads = [
        RoadSegment(
            disaster_id=d_id,
            osm_id="way/1029381",
            name="Joshimath - Raini Military Road (Sector 1)",
            highway_type="trunk",
            length_m=14200.0,
            status="blocked",
            is_blocked=True,
            blockage_reason="Submerged under 3.5m floodwaters and mud debris",
            geometry_geojson={
                "type": "LineString",
                "coordinates": [
                    [79.5645, 30.5580],
                    [79.6000, 30.5300],
                    [79.6278, 30.4945],
                    [79.6500, 30.4920],
                    [79.6830, 30.4905]
                ]
            },
            start_lat=30.5580,
            start_lon=79.5645,
            end_lat=30.4905,
            end_lon=79.6830
        ),
        RoadSegment(
            disaster_id=d_id,
            osm_id="way/1029382",
            name="Joshimath - Helang NH-58",
            highway_type="primary",
            length_m=8900.0,
            status="open",
            is_blocked=False,
            blockage_reason=None,
            geometry_geojson={
                "type": "LineString",
                "coordinates": [
                    [79.5645, 30.5580],
                    [79.5400, 30.5400],
                    [79.5100, 30.5180]
                ]
            },
            start_lat=30.5580,
            start_lon=79.5645,
            end_lat=30.5180,
            end_lon=79.5100
        ),
        RoadSegment(
            disaster_id=d_id,
            osm_id="way/1029383",
            name="Upper Ridgeline Ridge Trail (Emergency Evac Route)",
            highway_type="track",
            length_m=18400.0,
            status="open",
            is_blocked=False,
            blockage_reason="Pedestrian/ATV accessible only; steep gradients",
            geometry_geojson={
                "type": "LineString",
                "coordinates": [
                    [79.5645, 30.5580],
                    [79.5900, 30.5600],
                    [79.6300, 30.5400],
                    [79.6600, 30.5100],
                    [79.6841, 30.4912]
                ]
            },
            start_lat=30.5580,
            start_lon=79.5645,
            end_lat=30.4912,
            end_lon=79.6841
        ),
    ]
    db.add_all(roads)

    # 7. Infrastructure Assets (Hospitals, Buildings, Shelters)
    assets = [
        InfrastructureAsset(
            disaster_id=d_id,
            osm_id="node/554101",
            asset_type="hospital",
            name="Joshimath District Hospital (Level 2 Trauma)",
            latitude=30.5562,
            longitude=79.5630,
            status="safe",
            damage_probability=0.02,
            confidence=0.99,
            verification_status="field_confirmed"
        ),
        InfrastructureAsset(
            disaster_id=d_id,
            osm_id="node/554102",
            asset_type="hospital",
            name="Pipalkoti Community Health Centre",
            latitude=30.4280,
            longitude=79.4320,
            status="safe",
            damage_probability=0.01,
            confidence=0.99,
            verification_status="field_confirmed"
        ),
        InfrastructureAsset(
            disaster_id=d_id,
            osm_id="node/554103",
            asset_type="shelter",
            name="Joshimath Government Higher Secondary Relief Camp",
            latitude=30.5540,
            longitude=79.5680,
            status="safe",
            damage_probability=0.0,
            confidence=1.0,
            verification_status="field_confirmed"
        ),
        InfrastructureAsset(
            disaster_id=d_id,
            osm_id="way/221901",
            asset_type="building",
            name="Tapovan Vishnugad Hydropower Control Building",
            latitude=30.4942,
            longitude=79.6270,
            status="affected",
            damage_probability=0.88,
            confidence=0.91,
            verification_status="satellite_flood_overlay"
        ),
        InfrastructureAsset(
            disaster_id=d_id,
            osm_id="way/221902",
            asset_type="building",
            name="Raini Lower Settlement Residential Cluster (14 Structures)",
            latitude=30.4910,
            longitude=79.6838,
            status="destroyed",
            damage_probability=0.95,
            confidence=0.94,
            verification_status="field_confirmed"
        ),
        InfrastructureAsset(
            disaster_id=d_id,
            osm_id="way/221903",
            asset_type="building",
            name="Dhauliganga Forest Inspection Outpost",
            latitude=30.5020,
            longitude=79.6450,
            status="affected",
            damage_probability=0.76,
            confidence=0.85,
            verification_status="satellite_flood_overlay"
        ),
    ]
    db.add_all(assets)

    # 8. Available Emergency Resources
    resources = [
        Resource(disaster_id=d_id, resource_type="Heavy Rescue Boats (Zodiac)", total_available=12, allocated=4, base_location_name="Joshimath Forward Base"),
        Resource(disaster_id=d_id, resource_type="Helicopters (Air Force / NDRF ALH)", total_available=6, allocated=3, base_location_name="Gauchar Airstrip"),
        Resource(disaster_id=d_id, resource_type="4x4 All-Terrain Ambulances", total_available=18, allocated=8, base_location_name="Joshimath Base Hospital"),
        Resource(disaster_id=d_id, resource_type="Mobile Trauma Surgical Units", total_available=4, allocated=2, base_location_name="Joshimath Civil Lines"),
        Resource(disaster_id=d_id, resource_type="Emergency Food/Ration Crates (500-pack)", total_available=250, allocated=65, base_location_name="Rishikesh Logistics Staging"),
        Resource(disaster_id=d_id, resource_type="High-Capacity Water Purification Units", total_available=8, allocated=3, base_location_name="Chamoli District Stores"),
    ]
    db.add_all(resources)

    # 9. Active Rescue Teams
    teams = [
        RescueTeam(
            disaster_id=d_id,
            name="NDRF Team Alpha-1",
            team_type="Rapid Riverine & Alpine SAR",
            status="deployed",
            personnel_count=18,
            equipment_summary="Inflatable speedboats, Drone thermal imaging, High-angle ropes, SatPhones",
            current_lat=30.5500,
            current_lon=79.5700
        ),
        RescueTeam(
            disaster_id=d_id,
            name="SDRF Team Bravo-3",
            team_type="Medical Evacuation & Triage",
            status="en_route",
            personnel_count=12,
            equipment_summary="Portable defibrillators, Stretchers, Oxygen concentrators, Amphibious buggy",
            current_lat=30.5180,
            current_lon=79.5100
        ),
        RescueTeam(
            disaster_id=d_id,
            name="Air Force Sarang Recon-1",
            team_type="Aerial Reconnaissance & Winch Evac",
            status="deployed",
            personnel_count=6,
            equipment_summary="Mi-17V5 with belly hoist, FLIR camera, Food drop bundles",
            current_lat=30.5050,
            current_lon=79.6400
        ),
        RescueTeam(
            disaster_id=d_id,
            name="ITBP Quick Reaction Team Charlie",
            team_type="Tunnel and Debris Breaching",
            status="on_scene",
            personnel_count=24,
            equipment_summary="Heavy cutters, Mud pumps, Ground-penetrating radar, K9 search units",
            current_lat=30.4945,
            current_lon=79.6278
        ),
    ]
    db.add_all(teams)
    db.commit()

    # Re-fetch teams and settlements to link missions
    saved_teams = db.query(RescueTeam).filter(RescueTeam.disaster_id == d_id).all()
    team_alpha = next(t for t in saved_teams if "Alpha-1" in t.name)
    team_bravo = next(t for t in saved_teams if "Bravo-3" in t.name)

    # 10. Missions & Routes
    m1 = Mission(
        disaster_id=d_id,
        settlement_id=settlement_map["Raini Village"].id,
        team_id=team_alpha.id,
        title="Operation Raini Lifeline: Critical Evacuation & Airhead Setup",
        status="en_route",
        priority_level="CRITICAL",
        people_targeted=480,
        notes="Bridge B-17 collapsed. Team Alpha must utilize Ridge Trail to establish zipline ropeway across gorge for immediate triage."
    )
    db.add(m1)
    db.commit()
    db.refresh(m1)

    r1_primary = Route(
        disaster_id=d_id,
        mission_id=m1.id,
        origin_name="Joshimath Command Base",
        origin_lat=30.5580,
        origin_lon=79.5645,
        dest_name="Raini Village",
        dest_lat=30.4912,
        dest_lon=79.6841,
        distance_km=21.4,
        eta_minutes=42.0,
        is_alternate=False,
        is_compromised=True,
        safety_score=15.0,
        waypoints_geojson={
            "type": "LineString",
            "coordinates": [
                [79.5645, 30.5580],
                [79.6000, 30.5300],
                [79.6278, 30.4945],
                [79.6500, 30.4920],
                [79.6830, 30.4905],
                [79.6841, 30.4912]
            ]
        },
        blocked_segments=[
            {"name": "Bridge B-17 Span", "reason": "Collapsed span under 4.5m raging flood", "lat": 30.4905, "lon": 79.6830}
        ]
    )
    
    r1_alternate = Route(
        disaster_id=d_id,
        mission_id=m1.id,
        origin_name="Joshimath Command Base",
        origin_lat=30.5580,
        origin_lon=79.5645,
        dest_name="Raini Village (North Ridgeline Approach)",
        dest_lat=30.4912,
        dest_lon=79.6841,
        distance_km=28.7,
        eta_minutes=75.0,
        is_alternate=True,
        is_compromised=False,
        safety_score=88.5,
        waypoints_geojson={
            "type": "LineString",
            "coordinates": [
                [79.5645, 30.5580],
                [79.5900, 30.5600],
                [79.6300, 30.5400],
                [79.6600, 30.5100],
                [79.6841, 30.4912]
            ]
        },
        blocked_segments=[]
    )
    db.add_all([r1_primary, r1_alternate])
    db.commit()
    db.close()
    return d_id

if __name__ == "__main__":
    disaster_id = init_database()
    print(f"Database initialized and seeded successfully! Default Disaster ID: {disaster_id}")
