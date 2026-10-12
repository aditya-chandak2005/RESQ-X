import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_initial_search_configuration_assam_all():
    """Initial search configuration: Location=Assam, Hazard=All, Status=All, Period=All"""
    response = client.get("/api/incidents?state=Assam")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 5
    assert len(data["items"]) >= 5
    # Verify year distribution and hazard distribution exist
    assert "year_distribution" in data
    assert "hazard_distribution" in data
    assert len(data["year_distribution"]) > 0

    # Ensure all returned items belong to Assam
    for item in data["items"]:
        assert item["state"] == "Assam"

def test_search_by_ordinary_place_name_silchar():
    """Users search by place name 'Silchar' without entering coordinates"""
    response = client.get("/api/incidents?q=Silchar")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 1
    silchar_incident = next((i for i in data["items"] if "Silchar" in i["name"] or "Silchar" in (i.get("place_name") or "")), None)
    assert silchar_incident is not None
    assert silchar_incident["district"] == "Cachar"
    assert silchar_incident["state"] == "Assam"
    assert silchar_incident["status"] == "historical"
    assert silchar_incident["verification_status"] == "verified"

def test_search_by_district_cachar():
    """Filter by district 'Cachar'"""
    response = client.get("/api/incidents?district=Cachar")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] >= 1
    assert any("Silchar" in i["name"] for i in data["items"])

def test_search_by_river_features():
    """Search by river names: Barak and Brahmaputra"""
    # Barak river basin
    resp_barak = client.get("/api/incidents?q=Barak")
    assert resp_barak.status_code == 200
    barak_data = resp_barak.json()
    assert barak_data["total_count"] >= 1
    assert any("Silchar" in i["name"] or "Barak" in i["name"] for i in barak_data["items"])

    # Brahmaputra river basin
    resp_brahma = client.get("/api/incidents?q=Brahmaputra")
    assert resp_brahma.status_code == 200
    brahma_data = resp_brahma.json()
    assert brahma_data["total_count"] >= 1
    assert any("Kaziranga" in i["name"] or "Brahmaputra" in i["name"] for i in brahma_data["items"])

def test_ambiguous_place_name_resolution():
    """Geocoding resolution detects ambiguous place name 'Kamrup'"""
    response = client.get("/api/geocoding/search?q=Kamrup")
    assert response.status_code == 200
    res = response.json()
    assert "places" in res
    places = res["places"]
    assert len(places) >= 2
    # Check that Kamrup Metropolitan and Kamrup Rural are returned
    names = [p["name"] for p in places]
    assert any("Metropolitan" in n for n in names)
    assert any("Rural" in n for n in names)
    assert any(p.get("is_ambiguous", False) for p in places)

def test_date_range_with_no_matching_records():
    """Filtering by years with no events returns honest empty result"""
    response = client.get("/api/incidents?year_from=1980&year_to=1985")
    assert response.status_code == 200
    data = response.json()
    assert data["total_count"] == 0
    assert len(data["items"]) == 0
    assert isinstance(data["year_distribution"], dict)

def test_verified_vs_demo_data_distinction():
    """System honestly separates verified real-world records from synthetic/demo data"""
    # Verified: Silchar 2022
    silchar_resp = client.get("/api/incidents?q=Silchar")
    silchar = silchar_resp.json()["items"][0]
    assert silchar["verification_status"] == "verified"
    assert "Copernicus" in silchar["source_org"]
    assert silchar["source_url"] is not None
    assert "copernicus.eu" in silchar["source_url"]

    # Demo / Simulation: Silsako Drill
    demo_resp = client.get("/api/incidents?q=Silsako")
    demo_data = demo_resp.json()
    assert demo_data["total_count"] >= 1
    silsako = demo_data["items"][0]
    assert silsako["verification_status"] in ["demo", "unverified"]
    assert "DEMO" in (silsako.get("known_limitations") or "") or "DEMO" in silsako["name"]

def test_incident_detail_and_sources():
    """Retrieve full incident detail and verified provenance citations"""
    # Incident 2 is Silchar 2022
    response = client.get("/api/incidents/2")
    assert response.status_code == 200
    detail = response.json()
    assert "Silchar" in detail["name"]
    assert detail["state"] == "Assam"
    assert detail["district"] == "Cachar"
    assert len(detail["sources"]) >= 2
    copernicus_src = next((s for s in detail["sources"] if "Copernicus" in s["provider_name"]), None)
    assert copernicus_src is not None
    assert copernicus_src["record_identifier"] == "EMSR580"

def test_honest_data_availability_matrix():
    """Check data availability matrix reports honest states without fabricating zeros"""
    response = client.get("/api/incidents/2/data-availability")
    assert response.status_code == 200
    avail = response.json()
    assert avail["satellite_imagery"] in ["found", "verified", "available"]
    assert avail["flood_analysis"] in ["completed", "available"]
    assert avail["infrastructure_data"] in ["available"]
    assert avail["population_exposure"] in ["calculated", "available"]
    assert len(avail["data_sources"]) >= 2

    # Check Silsako drill incident
    silsako_search = client.get("/api/incidents?q=Silsako").json()
    silsako_id = silsako_search["items"][0]["id"]
    silsako_avail = client.get(f"/api/incidents/{silsako_id}/data-availability").json()
    assert silsako_avail["verification_status"] in ["demo", "unverified"]

def test_spatial_bounding_box_search():
    """Search incidents by bounding box covering Assam Cachar valley"""
    # Bounding box around Cachar, Assam: [92.4, 24.5, 93.2, 25.1]
    bbox_payload = {
        "min_lng": 92.4,
        "min_lat": 24.5,
        "max_lng": 93.2,
        "max_lat": 25.1
    }
    response = client.post("/api/incidents/spatial-search", json=bbox_payload)
    assert response.status_code == 200
    items = response.json()
    assert len(items) >= 1
    assert any("Silchar" in i["name"] for i in items)
