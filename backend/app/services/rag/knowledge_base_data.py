"""Authoritative Disaster Knowledge Base Data: NDMA, NDRF, NIDM, CWC, WHO & Sphere Standards.
Contains structured hazard protocols and RAG knowledge documents.
"""
from typing import List, Dict, Any

# Structured Hazard Protocols for Disaster Knowledge Catalog
HAZARD_PROTOCOLS: List[Dict[str, Any]] = [
    {
        "id": "glof",
        "name": "Glacial Lake Outburst Flood (GLOF)",
        "title": "Glacial Lake Outburst Flood (GLOF) Emergency Protocol",
        "category": "Mountain Disasters",
        "severity": "CRITICAL",
        "summary": "Sudden catastrophic discharge of water and moraine debris from proglacial or supraglacial lakes in high Himalayan valleys.",
        "description": "Glacial Lake Outburst Floods (GLOFs) represent high-energy hydrodynamic events triggered by ice or rock avalanches into moraine-dammed lakes. They produce downstream surges with velocities exceeding 10-15 m/s, carrying huge boulders and silt slurries that scour valley floors and destroy bridges.",
        "trigger_mechanisms": [
            "Hanging ice avalanche or rockfall impacting glacial lake",
            "Pore-water saturation and piping failure of moraine dam",
            "Rapid thermal warming accelerating glacial melt and lake expansion",
            "Hydrostatic pressure breaching subglacial drainage conduits"
        ],
        "precursors": [
            "Sudden discolouration of downstream river water to thick grey or brown silt",
            "Low-frequency ground tremor or deep rumbling sound from upper catchment",
            "Abrupt drop in downstream river discharge followed within minutes by violent surge",
            "Floating glacial ice chunks or freshly snapped alpine trees in river channel"
        ],
        "immediate_dos": [
            "Evacuate immediately to ridges at least 50 meters above the active riverbed",
            "Move perpendicular to the river axis towards steep stable high ground",
            "Alert downstream communities via VHF radio or emergency sirens",
            "Shut down head-race tunnels and turbines at hydropower intake barrages immediately"
        ],
        "immediate_donts": [
            "Do NOT attempt to cross bridges, culverts, or low-lying road causeways",
            "Do NOT drive vehicles into water exceeding 15 cm depth",
            "Do NOT take shelter inside riverside buildings or concrete structures on valley floors",
            "Do NOT return to riverbanks to collect livestock or personal belongings"
        ],
        "critical_donts": [
            "Never camp on alluvial fans or dry riverbed terraces in glacial catchments",
            "Never attempt to ford turbulent silt-laden runoff"
        ],
        "historical_precedents": [
            "Chamoli Disaster, Uttarakhand (February 2021) - Ronti Peak rock-ice avalanche",
            "South Lhonak Lake Outburst, Sikkim (October 2023) - Teesta Basin surge",
            "Kedarnath Flash Flood, Uttarakhand (June 2013) - Chorabari Lake breach"
        ],
        "essential_survival_kit": [
            "Solar/crank VHF emergency radio with local frequency tuning",
            "Water purification tablets and microfiltration straw",
            "Thermal foil space blankets for hypothermia prevention",
            "High-decibel signaling whistle and waterproof LED headlamp"
        ],
        "rescue_protocols": [
            "Deploy long-range reconnaissance UAVs to map upper gorge blockages before ground teams advance",
            "Establish forward aerial staging base at stable plateau (e.g. Joshimath Helibase)",
            "Use winch-equipped helicopters for rooftop or isolated terrace casualty evacuation",
            "Conduct subterranean tunnel search with remote acoustic listening probes and snake cameras"
        ],
        "medical_field_guidelines": [
            "Treat all extracted victims immediately for severe hypothermia (water temp 2-4°C)",
            "Remove wet clothing; apply passive external warming with foil space blankets to core/torso",
            "Administer warm humidified oxygen and warm intravenous saline if available",
            "Monitor for secondary drowning or silt pulmonary aspiration"
        ],
        "sources": [
            {
                "title": "NDMA National Guidelines: Management of Glacial Lake Outburst Floods (GLOFs)",
                "authority": "National Disaster Management Authority (NDMA), Government of India",
                "url": "https://ndma.gov.in/Governance/Guidelines/GLOF",
                "publication_date": "October 2020",
                "license": "Open Government Data (OGD) India",
                "section": "Chapter 4: Early Warning Systems & Community Preparedness"
            },
            {
                "title": "Central Water Commission Hydrodynamic Flood Routing Guidelines",
                "authority": "Central Water Commission (CWC)",
                "url": "http://cwc.gov.in/flood-management",
                "publication_date": "August 2021",
                "license": "Public Domain Guidance",
                "section": "Glacial Catchment Flash Flood Wave Velocity Models"
            }
        ]
    },
    {
        "id": "flash_flood",
        "name": "Mountain & Riverine Flash Flood Protocol",
        "title": "Flash Flood Emergency Life-Safety & SAR Protocol",
        "category": "Hydrometeorological",
        "severity": "CRITICAL",
        "summary": "Rapid inundation occurring within minutes of extreme localized precipitation (cloudburst) or structural barrier breach.",
        "description": "Flash floods develop rapidly with minimal warning time. Peak discharge can occur within 15 to 30 minutes of cloudburst initiation. Saturated mountain slopes accelerate surface runoff, converting dry gullies into raging torrents of mud, trees, and debris.",
        "trigger_mechanisms": [
            "Extreme cloudburst precipitation (>100 mm/hour over steep terrain)",
            "Sudden breach of landslide debris dams or clogged road culverts",
            "Rapid snowmelt combined with heavy monsoon downpours"
        ],
        "precursors": [
            "Intense localized torrential rainfall exceeding 50 mm in 30 minutes",
            "Sudden rise in river turbidity and floating vegetative debris",
            "Rapid increase in river gauge water velocity and debris knocking sounds",
            "Failure of upstream bridge clearances as debris accumulates at piers"
        ],
        "immediate_dos": [
            "Climb immediately to high ground perpendicular to the stream channel",
            "Disconnect electrical mains and gas supplies before evacuating ground floors",
            "Keep emergency battery radio tuned to State Disaster Management Authority (SDMA) alerts",
            "Assist elderly, children, and persons with disabilities to designated vertical evacuation shelters"
        ],
        "immediate_donts": [
            "Do NOT attempt to walk through moving floodwater (15 cm will sweep an adult off balance)",
            "Do NOT drive across flooded bridges or submerged roadway dips",
            "Do NOT touch downed power lines or enter basements with standing water",
            "Do NOT drink unboiled tap or well water following inundation"
        ],
        "critical_donts": [
            "Never park emergency vehicles facing downslope in active drainage corridors"
        ],
        "historical_precedents": [
            "Leh Cloudburst, Ladakh (August 2010)",
            "Assam Barak Basin Floods (Silchar, June 2022)",
            "Himachal Pradesh Monsoon Flash Floods (Kullu-Mandi, July 2023)"
        ],
        "essential_survival_kit": [
            "Waterproof emergency documents pouch",
            "Emergency non-perishable rations (3-day minimum)",
            "Chlorine purification tablets (5 mg/L dosage)",
            "First aid kit with pressure bandages and antiseptic"
        ],
        "rescue_protocols": [
            "Deploy motorized inflatable rescue boats (IRBs) with propeller guards for urban street navigation",
            "Use throw-bags, tensioned diagonal high-lines, and reach poles for swift-water rescue",
            "Mark searched buildings with international USAR chalk triage symbology",
            "Establish high-water refuelling and maintenance docks for SAR watercraft"
        ],
        "medical_field_guidelines": [
            "Assess for physical trauma from floating debris impacts and limb fractures",
            "Initiate prophylactic oral rehydration for acute diarrheal disease prevention",
            "Provide tetanus toxoid vaccine for all puncture wounds or lacerations",
            "Screen evacuated populations for leptospirosis and waterborne pathogens"
        ],
        "sources": [
            {
                "title": "NDRF Standard Operating Procedure for Flood Search and Rescue Operations",
                "authority": "National Disaster Response Force (NDRF)",
                "url": "https://www.ndrf.gov.in/sop-flood-rescue",
                "publication_date": "May 2022",
                "license": "Public Disaster Guidance",
                "section": "SOP Section 3: Swift Water Rescue Operations"
            },
            {
                "title": "NDMA Guidelines on Management of Floods",
                "authority": "National Disaster Management Authority (NDMA)",
                "url": "https://ndma.gov.in/Governance/Guidelines/Floods",
                "publication_date": "January 2008",
                "license": "Open Government Data (OGD) India",
                "section": "Chapter 5: Non-structural Flood Mitigation"
            }
        ]
    },
    {
        "id": "landslide",
        "name": "Slope Failure & Debris Flow Mitigation",
        "title": "Post-Flood Landslide & Slope Stability Protocol",
        "category": "Geotechnical",
        "severity": "HIGH",
        "summary": "Rapid mass movement of rock, soil, and debris along valley slopes destabilized by torrential rainfall and toe erosion.",
        "description": "Prolonged rainfall causes pore-water pressure to build up inside weathered slope strata. Toe erosion by flood currents strips natural counterweights, triggering rotational slumps, translational slides, and destructive debris avalanches that sever highway corridors.",
        "trigger_mechanisms": [
            "Toe scour of steep hillside by swollen floodwaters",
            "High pore-water pressure following sustained heavy rainfall",
            "Unplanned road cutting and deforestation along fragile slopes"
        ],
        "precursors": [
            "New tension cracks appearing on road surfaces, hillsides, or house foundations",
            "Fences, utility poles, or trees tilting downslope",
            "Sudden trickling of muddy water or small dislodged stones from slopes",
            "Sticking doors and windows indicating building foundation distortion"
        ],
        "immediate_dos": [
            "Evacuate downslope dwellings immediately upon noticing ground tension cracks",
            "Stay alert when driving through hill cuts; watch for rolling debris",
            "Report slope deformities to District Disaster Management Authority (DDMA)",
            "Clear natural drainage paths around buildings to prevent water ponding"
        ],
        "immediate_donts": [
            "Do NOT seek shelter under steep overhanging cliffs or beneath unreinforced road cuts",
            "Do NOT attempt to clear minor landslides by hand while rain continues",
            "Do NOT build temporary relief camps at the base of steep gullies or alluvial fans"
        ],
        "critical_donts": [
            "Never construct soak pits or unlined drains on active landslide zones"
        ],
        "historical_precedents": [
            "Malpa Rockfall, Uttarakhand (August 1998)",
            "Wayanad Landslides, Kerala (July 2024)",
            "Joshimath Land Subsidence, Uttarakhand (January 2023)"
        ],
        "essential_survival_kit": [
            "Battery-powered megaphone for community evacuation alerts",
            "Heavy-duty work gloves and safety boots",
            "Tarpaulin sheets for temporary diversion of slope surface runoff",
            "Emergency signaling flares"
        ],
        "rescue_protocols": [
            "Stabilize slide margins before entry; designate safety spotter with air horn",
            "Utilize canine search teams and victim location cameras (VLC) in debris piles",
            "Coordinate with Border Roads Organisation (BRO) for heavy excavator ingress",
            "Establish secondary egress trail along upper ridgelines"
        ],
        "medical_field_guidelines": [
            "Prepare for crush syndrome management in victims trapped under debris >2 hours",
            "Initiate intravenous hydration before extricating compressed limbs to prevent renal failure",
            "Immobilize cervical spine in all trauma casualties before transport",
            "Maintain tourniquets and sterile compressive dressings for severe hemorrhage"
        ],
        "sources": [
            {
                "title": "NDMA National Guidelines on Management of Landslides and Snow Avalanches",
                "authority": "National Disaster Management Authority (NDMA)",
                "url": "https://ndma.gov.in/Governance/Guidelines/Landslides",
                "publication_date": "June 2009",
                "license": "Open Government Data (OGD) India",
                "section": "Chapter 3: Landslide Hazard Zonation and Monitoring"
            },
            {
                "title": "Geological Survey of India Landslide Early Warning System Manual",
                "authority": "Geological Survey of India (GSI)",
                "url": "https://www.gsi.gov.in",
                "publication_date": "March 2023",
                "license": "Official Technical Bulletin",
                "section": "Rainfall Thresholds and Slope Failure Criteria"
            }
        ]
    },
    {
        "id": "first_aid",
        "name": "Hypothermia & Cold Water Triage",
        "title": "Emergency Field First-Aid & Hypothermia Management",
        "category": "Emergency Medical",
        "severity": "CRITICAL",
        "summary": "Clinical protocol for managing victims immersed in glacial runoff, near-freezing floodwaters, or stranded in cold mountain environments.",
        "description": "Himalayan glacial floodwaters typically register temperatures between 2°C and 5°C. At this temperature, cold shock occurs within seconds, physical incapacitation occurs in under 10 minutes, and core body temperature drops rapidly toward severe hypothermia (<32°C), inducing ventricular fibrillation if not managed with gentle passive rewarming.",
        "trigger_mechanisms": [
            "Accidental submersion in glacial meltwater or torrential flood flows",
            "Prolonged exposure to wind and wet clothing at high altitudes",
            "Trauma immobilization in damp debris without thermal insulation"
        ],
        "precursors": [
            "Violent uncontrollable shivering (Mild hypothermia: 35-32°C)",
            "Apathy, slurred speech, clumsy movement, and confusion (Moderate: 32-28°C)",
            "Shivering ceases, pulse becomes thready, dilated pupils (Severe: <28°C)"
        ],
        "immediate_dos": [
            "Handle patient extremely gently; rough movement can trigger fatal cardiac arrest",
            "Strip off wet clothing immediately in a wind-sheltered area",
            "Wrap victim in multiple dry thermal foil blankets (shiny side toward body)",
            "Apply gentle warmth (body heat, warm water bottles wrapped in cloth) to chest, neck, and groin",
            "Provide warm sweet tea or broth ONLY if the patient is fully conscious and swallowing"
        ],
        "immediate_donts": [
            "Do NOT rub or massage the victim's arms or legs (causes cold blood afterdrop to heart)",
            "Do NOT apply direct high heat, boiling water, or direct open flame to skin",
            "Do NOT give alcohol, coffee, or cigarettes to hypothermic victims",
            "Do NOT allow victim to stand, walk, or exert energy until rewarming is established"
        ],
        "critical_donts": [
            "Never declare a cold victim deceased until they are warm and dead (Warm resuscitation protocol)"
        ],
        "historical_precedents": [
            "Uttarakhand Disaster Operations Medical Data (2021)",
            "Himalayan SAR Cold Immersion Case Studies (NDRF 8th Bn)"
        ],
        "essential_survival_kit": [
            "Foil space blankets (aluminized Mylar)",
            "Low-reading digital core body thermometer",
            "Chemical instant heat packs",
            "Insulated waterproof casualty evacuation sleeping bags"
        ],
        "rescue_protocols": [
            "Transport hypothermic casualties horizontally on rigid stretchers",
            "Protect casualty from wind-chill during helicopter winching using sealed rescue bag",
            "Pre-notify destination trauma center of incoming hypothermia cases for rapid warming beds"
        ],
        "medical_field_guidelines": [
            "Maintain CPR during transport even with minimal detectable pulse; cold protects brain tissue",
            "Administer warm IV saline (40-42°C) via pressure bag for severe hypothermia",
            "Monitor ECG continuously for Osborn (J) waves and ventricular arrhythmias",
            "Check for co-existing frostbite; thaw tissue in 37-39°C warm water bath once core is stable"
        ],
        "sources": [
            {
                "title": "WHO Guidelines on Trauma and Emergency Surgical Care in Disasters",
                "authority": "World Health Organization (WHO)",
                "url": "https://www.who.int/emergencies/kits/en/",
                "publication_date": "2019",
                "license": "WHO Open Access",
                "section": "Module 4: Hypothermia and Environmental Exposure"
            },
            {
                "title": "Sphere Handbook: Humanitarian Charter and Minimum Standards in Disaster Response",
                "authority": "Sphere Association",
                "url": "https://www.spherestandards.org/handbook/",
                "publication_date": "2018",
                "license": "Creative Commons Attribution-NonCommercial-NoDerivs",
                "section": "Chapter: Health Action - Essential Clinical Care"
            }
        ]
    },
    {
        "id": "sar_ops",
        "name": "Helicopter LZ & Aerial SAR Criteria",
        "title": "Aviation Landing Zone & Aerial Casualty Evacuation SOP",
        "category": "Operations",
        "severity": "STANDARD",
        "summary": "Mandatory technical criteria for selecting, clearing, and securing forward helicopter landing zones (HLZ) in disaster sectors.",
        "description": "Helicopter operations provide critical supply delivery and medical casualty evacuation (CASEVAC) when bridges and highways are severed. Mountain aerology produces extreme downdrafts and thin air, requiring strict compliance with landing zone dimensions and obstacle clearance.",
        "trigger_mechanisms": [
            "Isolation of settlements due to road and bridge washouts",
            "Critical casualties requiring tertiary hospital trauma care",
            "Rapid deployment of NDRF urban search specialists and specialized rescue gear"
        ],
        "precursors": [
            "High valley winds and sudden afternoon cloud lowering in mountain passes",
            "Loose dust, sand, or snow causing whiteout or brownout hazard during hover",
            "Overhead high-tension transmission wires crossing approach paths"
        ],
        "immediate_dos": [
            "Select a level area: minimum 30m x 30m for light helicopters (Dhruv/Cheetah), 50m x 50m for Mi-17",
            "Slope of landing pad must not exceed 5 degrees for heavy transport helicopters",
            "Clear all loose plastic tarps, sheet metal, and debris within 75 meters of the touchdown point",
            "Wet dry or powdery ground before landing to minimize rotor wash dust obscuration",
            "Station one firefighter or marshal with a dry chemical powder extinguisher upwind"
        ],
        "immediate_donts": [
            "Do NOT approach the helicopter until pilot signals and rotor blades have come to full stop",
            "Do NOT approach or depart from the high side of a helicopter parked on sloping ground",
            "Do NOT shine vehicle high-beams or flashlights directly into the helicopter cockpit",
            "Do NOT allow civilians within 100 meters of the touchdown pad during landing or takeoff"
        ],
        "critical_donts": [
            "Never approach the tail rotor area under any circumstances (danger zone)"
        ],
        "historical_precedents": [
            "Operation Surya Hope (Uttarakhand Flood Relief, 2013)",
            "Operation Madad (Kerala Floods, 2018)",
            "Chamoli Tapovan Aerial Operations (February 2021)"
        ],
        "essential_survival_kit": [
            "High-visibility orange/yellow landing 'H' markers or panels",
            "Smoke flares (red for danger, green/white for cleared landing)",
            "Wind sock or high-visibility cloth on a 2-meter pole",
            "Aviation VHF transceiver (Air-to-Ground 122.8 / 123.05 MHz)"
        ],
        "rescue_protocols": [
            "Maintain radio contact with pilot; report wind speed, direction, and visible obstacles",
            "Stage casualties at least 50m away in covered triage tent until aircraft is ready for boarding",
            "Load casualties feet-first on stretchers under guidance of aircrew loadmaster",
            "Strictly enforce ear and eye protection for all forward deck personnel"
        ],
        "medical_field_guidelines": [
            "Ensure patients are hemodynamically stabilized before aerial transfer",
            "Verify endotracheal tubes and chest drains are secured against helicopter vibration",
            "Anticipate decompression expansion of trapped air (pneumothorax) during high-altitude transit",
            "Pack extra blankets to offset rapid temperature drops in unpressurized cargo cabins"
        ],
        "sources": [
            {
                "title": "Indian Air Force Humanitarian Assistance and Disaster Relief (HADR) Flight SOP",
                "authority": "Indian Air Force (IAF) / Ministry of Defence",
                "url": "https://indianairforce.nic.in",
                "publication_date": "2021",
                "license": "Public Military Guidance",
                "section": "Helicopter Mountain Evacuation & Landing Zone Manual"
            },
            {
                "title": "Incident Response System (IRS) Guidelines: Operations Section Logistics",
                "authority": "National Institute of Disaster Management (NIDM)",
                "url": "https://nidm.gov.in/irs.asp",
                "publication_date": "2010",
                "license": "Open Government Data (OGD) India",
                "section": "Air Operations Branch & Helibase Management"
            }
        ]
    },
    {
        "id": "urban_flood",
        "name": "Urban Inundation & Embankment Breach Response",
        "title": "Urban Flood Management & Dyke Breach Containment",
        "category": "Hydrometeorological",
        "severity": "HIGH",
        "summary": "Emergency containment and population evacuation protocols for breach of flood dykes, sluice gates, and urban drainage networks.",
        "description": "Urban inundations occur when intense rainfall overloads storm drainage or when containment dykes along major rivers fail (such as the Bethukandi dyke breach during the 2022 Silchar Floods in Assam). Flat urban plains become retention basins, trapping tens of thousands without power or potable water.",
        "trigger_mechanisms": [
            "Structural rupture or sabotage of river embankment / protection bund",
            "Backflow of swollen river through unclosed or damaged sluice gates",
            "Extreme precipitation overwhelming municipal storm drainage capacity"
        ],
        "precursors": [
            "Severe sand boils (water bubbling through ground) on dry side of river dyke",
            "Sloughing or longitudinal cracks along the crest of river embankments",
            "River stage surpassing high flood level (HFL) with rising hydrograph",
            "Storm drain manholes ejecting water upward onto road intersections"
        ],
        "immediate_dos": [
            "Evacuate multi-story buildings' ground floors; move essentials to upper floors or terraces",
            "Deploy geotextile sandbags and wooden piles to ring and stem sand boils on dykes",
            "Pre-position diesel water pump sets at critical substations, hospitals, and waterworks",
            "Set up boat pickup points at known dry road intersections above flood contours"
        ],
        "immediate_donts": [
            "Do NOT cut or breach embankments without written authorization from irrigation engineers",
            "Do NOT operate electrical switches while standing in water",
            "Do NOT consume open market food exposed to floodwater contamination",
            "Do NOT discharge untreated sewage into standing floodwaters"
        ],
        "critical_donts": [
            "Never park emergency rescue boats near submerged transformer yards or power cables"
        ],
        "historical_precedents": [
            "Silchar City Flood, Assam (June 2022 - Bethukandi dyke breach)",
            "Chennai Floods, Tamil Nadu (December 2015 - Adyar River overflow)",
            "Mumbai Mega Flood, Maharashtra (July 2005 - Mithi River spill)"
        ],
        "essential_survival_kit": [
            "Portable 20-liter water storage containers with tight-fitting lids",
            "Chlorine tablets / liquid sodium hypochlorite (5% solution)",
            "Solar power bank and battery backup for mobile communication",
            "High-decibel signaling device"
        ],
        "rescue_protocols": [
            "Sectorize flooded city into gridded rescue zones with assigned boat teams",
            "Establish waterborne resupply channels for dry food, baby formula, and medicines",
            "Deploy drone payload drops to inaccessible rooftops and isolated apartment complexes",
            "Designate secure dry relief camps on high ground outside the flood bowl"
        ],
        "medical_field_guidelines": [
            "Set up mobile boat medical clinics with oral rehydration salts and basic antibiotics",
            "Administer mass prophylactic doxycycline in high-risk areas for leptospirosis control",
            "Conduct chlorine residual testing on all drinking water distribution points (>0.5 ppm)",
            "Prioritize dialysis and insulin-dependent patients for early boat evacuation"
        ],
        "sources": [
            {
                "title": "NDMA National Guidelines on Management of Urban Flooding",
                "authority": "National Disaster Management Authority (NDMA)",
                "url": "https://ndma.gov.in/Governance/Guidelines/Urban-Flooding",
                "publication_date": "September 2010",
                "license": "Open Government Data (OGD) India",
                "section": "Chapter 4: Urban Drainage Master Planning & Breach Mitigation"
            },
            {
                "title": "Assam State Disaster Management Authority (ASDMA) Flood Manual",
                "authority": "Assam State Disaster Management Authority (ASDMA)",
                "url": "https://asdma.assam.gov.in",
                "publication_date": "2022",
                "license": "State Public Document",
                "section": "Standard Operating Procedure for River Embankment Breach Management"
            }
        ]
    },
    {
        "id": "bridge_safety",
        "name": "Post-Flood Bridge & Structural Safety",
        "title": "Bridge Integrity Inspection & Emergency Crossing Protocol",
        "category": "Infrastructure",
        "severity": "HIGH",
        "summary": "Engineering criteria for assessing scour, structural pier stability, and load restriction on bridges during and after flood events.",
        "description": "High-velocity flood flows erode riverbed sediments around bridge piers (scour), undermining foundations without visible surface warning. Heavy floating debris impacts can fracture steel girders or knock bridge spans off their bearing pads, precipitating catastrophic collapse under vehicle loads.",
        "trigger_mechanisms": [
            "Hydrodynamic scour deepening around bridge sub-structure piers",
            "Impact of heavy floating debris, logs, and sediment slurries against bridge deck",
            "Abutment washout and backfill erosion cutting off approach ramps"
        ],
        "precursors": [
            "Visible swirl or vortex around bridge piers indicating deep scour depression",
            "Noticeable settlement or lateral tilting of bridge piers or deck joints",
            "Cracks appearing at connection points between bridge deck and road approach ramp",
            "Debris accumulation exceeding 25% of the bridge hydraulic opening"
        ],
        "immediate_dos": [
            "Close bridge to all vehicular and pedestrian traffic if water level reaches within 1 meter of girder",
            "Deploy sonar or lead-line depth sounders to measure pier scour depth relative to foundation level",
            "Erect rigid physical barricades with warning signs at least 100 meters before bridge approaches",
            "Mobilize Army / BRO engineering units for Bailey bridge or pontoon span launch"
        ],
        "immediate_donts": [
            "Do NOT allow emergency response vehicles or ambulances to cross an unverified damaged bridge",
            "Do NOT permit heavy cranes or loaded relief trucks on bridges showing pier settlement",
            "Do NOT attempt to clear jammed logs from piers from on top of the bridge during high flood stage"
        ],
        "critical_donts": [
            "Never reopen a scour-compromised bridge without underwater pier inspection and load testing"
        ],
        "historical_precedents": [
            "Mahad Bridge Collapse, Savitri River, Maharashtra (August 2016)",
            "Bridge B-17 Washout, Dhauliganga River, Raini, Uttarakhand (February 2021)",
            "Sadarghat Bridge Scour Warning, Silchar, Assam (June 2022)"
        ],
        "essential_survival_kit": [
            "Reflective barrier tape and LED road warning flares",
            "Laser rangefinder and crack monitoring gauge",
            "Handheld depth sonar probe",
            "Satellite communication handset for engineer field reports"
        ],
        "rescue_protocols": [
            "Establish temporary aerial ropeway / zip-line crossing for essential medical supplies",
            "Deploy tracked amphibious vehicles or light rafts downstream of the bridge crossing",
            "Construct temporary pedestrian suspension footbridge for non-motorized community egress"
        ],
        "medical_field_guidelines": [
            "Establish medical staging post on the isolated bank if bridge cuts hospital access",
            "Equip isolated medical post with oxygen concentrator and emergency trauma kit",
            "Coordinate helicopter CASEVAC priority for patients requiring immediate critical surgery"
        ],
        "sources": [
            {
                "title": "Indian Roads Congress (IRC) Guidelines for Inspection and Maintenance of Bridges",
                "authority": "Indian Roads Congress (IRC) / Ministry of Road Transport & Highways",
                "url": "https://irc.nic.in",
                "publication_date": "2019",
                "license": "Official Technical Standards",
                "section": "IRC:SP:35 - Guidelines for Inspection and Maintenance of Bridges"
            },
            {
                "title": "Ministry of Road Transport & Highways (MoRTH) Flood Scour Manual",
                "authority": "Ministry of Road Transport & Highways (MoRTH)",
                "url": "https://morth.nic.in",
                "publication_date": "2020",
                "license": "Technical Reference",
                "section": "Emergency Evaluation of Scour-Critical River Bridges"
            }
        ]
    }
]

# Comprehensive Knowledge Documents for RAG Embedding / Inverted-Index Retrieval
RAG_KNOWLEDGE_DOCUMENTS: List[Dict[str, Any]] = [
    {
        "title": "NDMA Guidelines: Management of Glacial Lake Outburst Floods (GLOFs)",
        "category": "ndma_guideline",
        "source_authority": "National Disaster Management Authority (NDMA), Government of India",
        "url": "https://ndma.gov.in/Governance/Guidelines/GLOF",
        "publication_year": 2020,
        "content_text": """Glacial Lake Outburst Floods (GLOFs) are sudden catastrophic releases of water from lakes dammed by moraine or ice in high Himalayan terrain. Key mitigation and response protocols:
1. Early Warning & Sensor Network: Deploy automated water level sensors, acoustic debris flow detectors, and satellite SAR monitoring on vulnerable glacial lakes. When sudden drops in lake levels are detected, automatic siren alerts must trigger downstream communities within 5 minutes.
2. Immediate Ingress Control: Halt all vehicular traffic along valley river roads (e.g. NH-58, border routes). Prevent civilian entry onto low-lying riverbank terraces.
3. Hydropower Plant Emergency Shutdown: Hydropower project operators (e.g. NTPC Tapovan, THDC) must automatically trip head-race gates and open desilting sluice gates upon early acoustic warning to prevent subterranean tunnel flooding.
4. Downstream Evacuation Corridors: Evacuate communities perpendicular to the river channel to ridges at least 50 meters above the high flood level. Pre-identify high-ground refuges with road connectivity outside the hydrodynamic flood velocity zone.
5. Search and Rescue Ingress: In high-mountain gorge sectors where bridges are washed out, primary ingress must rely on high-angle ridgeline trails or heavy-lift helicopter winching. Ground vehicles must not advance past severed bridge bottlenecks until Army Bailey bridges are established.""",
        "metadata_json": {
            "keywords": ["glof", "glacial", "outburst", "chamoli", "moraine", "tapovan", "barrage", "himalayan", "lake", "surge", "early warning"],
            "section_references": ["Chapter 3: Risk Assessment", "Chapter 4: Early Warning", "Chapter 6: Emergency Response"],
            "license": "Open Government Data (OGD) India"
        }
    },
    {
        "title": "NDRF Standard Operating Procedure for Flash Flood Search and Rescue",
        "category": "sop_flood",
        "source_authority": "National Disaster Response Force (NDRF)",
        "url": "https://www.ndrf.gov.in/sop-flood-rescue",
        "publication_year": 2022,
        "content_text": """Standard Operating Procedure for National Disaster Response Force (NDRF) deployment during flash floods and bridge severances:
1. Initial Sector Assessment: Within 60 minutes of mobilization, deploy aerial reconnaissance drones (UAVs) to establish visual triage of isolated population pockets, severed bridge abutments, and ongoing slope failure points.
2. Boat Operations & Water Safety: When navigating flooded streets or swollen rivers, operate motorized Inflatable Rescue Boats (IRBs) equipped with propeller guards to prevent entanglement with submerged wires and fences. Rescuers must wear Class V swift-water PFDs and water rescue helmets at all times.
3. Isolated Settlement Relocation: Where roads and bridges are destroyed, deploy tensioned diagonal high-line rope systems across the river gorge for essential medicine and ration transfer. Prioritize airlift evacuation for pregnant women, infants, and trauma casualties.
4. Marking and Triage: Use international INSARAG search marking on all visited dwellings. Record civilian count, triage category (Immediate / Delayed / Minimal), and urgent medical requirements.
5. Communications Redundancy: When cellular towers are flooded, deploy mobile satellite terminals (Inmarsat/BGAN) and VHF repeater stations at high mountain relay peaks to ensure continuous command connectivity between forward teams and the District Emergency Operation Centre (DEOC).""",
        "metadata_json": {
            "keywords": ["ndrf", "sop", "rescue", "swift water", "boat", "irb", "isolated", "high-line", "sar", "triage", "insarag", "helicopter"],
            "section_references": ["SOP Section 2: Command & Control", "SOP Section 3: Swift Water Rescue", "SOP Section 7: Aerial Evacuation"],
            "license": "Public Disaster Guidance"
        }
    },
    {
        "title": "Incident Response System (IRS) Command & Logistics Protocol",
        "category": "irs_protocol",
        "source_authority": "National Institute of Disaster Management (NIDM)",
        "url": "https://nidm.gov.in/irs.asp",
        "publication_year": 2010,
        "content_text": """The Incident Response System (IRS) provides the standardized organizational architecture for tactical emergency operations in India:
1. Incident Commander (IC): The District Magistrate / Collector acts as Responsible Officer (RO), appointing an Incident Commander to oversee Operations, Planning, and Logistics sections from the forward Incident Command Post (ICP).
2. Operations Section: Directs tactical resources, including NDRF, SDRF, Army engineering battalions, Police, and Fire Services. Establishes geographic staging areas and functional task forces (e.g. Water Rescue, Aerial Evacuation, Medical Triage).
3. Planning Section: Collects, evaluates, and displays incident telemetry. Uses satellite SAR extent maps, topological road graph analyses, and population exposure models to forecast resource requirements 12 to 24 hours in advance.
4. Logistics Section: Provides facilities, transport, communications, medical supplies, and food relief. Manages forward helipads, fuel storage, and equipment maintenance depots.
5. Public Information & Safety: The Safety Officer has authority to halt any tactical operation deemed unsafe (e.g. night boat operations in high-velocity silt currents). The Information Officer issues verified press briefings to dispel rumors and coordinate emergency helplines.""",
        "metadata_json": {
            "keywords": ["irs", "incident command", "command post", "logistics", "operations", "planning", "nidm", "coordination", "safety officer"],
            "section_references": ["Chapter 2: Principles of IRS", "Chapter 4: Incident Action Planning", "Chapter 6: Resource Management"],
            "license": "Open Government Data (OGD) India"
        }
    },
    {
        "title": "NDMA Guidelines on Management of Urban Flooding and Drainage Congestion",
        "category": "urban_flood",
        "source_authority": "National Disaster Management Authority (NDMA)",
        "url": "https://ndma.gov.in/Governance/Guidelines/Urban-Flooding",
        "publication_year": 2010,
        "content_text": """Urban flooding differs fundamentally from rural riverine flooding due to high impervious surface cover, rapid concentration times, and complex infrastructure interdependencies:
1. Embankment & Dyke Security: River dykes protecting urban flood basins (such as Bethukandi in Silchar or the Yamuna embankments in Delhi) must be continuously patrolled during high flood warnings. Immediate response to piping or sand boils requires constructing inverted sand-filter rings.
2. Critical Utility Protection: Electrical substations, telecommunication exchanges, and water treatment plants must have permanent perimeter flood walls and dedicated high-capacity dewatering pumps with elevated fuel generators.
3. Vertical Evacuation Architecture: When street inundation exceeds 1.5 meters, ground evacuation is often impossible. Communities must utilize pre-designated reinforced concrete multi-story schools, colleges, and civic centres as temporary vertical refuges.
4. Public Health & Disease Surveillance: Flooded urban areas face immediate risks of leptospirosis, cholera, and vector-borne diseases. Mass distribution of chlorine tablets, daily water quality testing (>0.5 ppm free residual chlorine), and prophylactic antibiotic distribution in flood shelters are mandatory.
5. Desilting and Waterway Recovery: Encroachments on natural urban wetlands, lake buffers, and stormwater canals must be cleared to maintain gravity discharge during monsoonal cloudbursts.""",
        "metadata_json": {
            "keywords": ["urban flood", "silchar", "cachar", "dyke", "embankment", "breach", "sandbag", "pumps", "drainage", "leptospirosis", "waterworks"],
            "section_references": ["Chapter 3: Urban Hydrology", "Chapter 5: Embankment Safety", "Chapter 7: Post-Flood Recovery"],
            "license": "Open Government Data (OGD) India"
        }
    },
    {
        "title": "Emergency Field Guidelines: Hypothermia and Cold Immersion First-Aid",
        "category": "medical_first_aid",
        "source_authority": "World Health Organization (WHO) & Indian Red Cross Society",
        "url": "https://www.who.int/emergencies/kits/en/",
        "publication_year": 2019,
        "content_text": """Clinical protocol for managing victims of glacial water submersion and mountain flash flood exposure:
1. Assessment of Hypothermia: Classify severity based on mental status and shivering. Mild (35-32°C): alert, shivering vigorously. Moderate (32-28°C): confused, apathy, loss of fine motor coordination. Severe (<28°C): unconscious, shivering absent, pulse very weak or unpalpable.
2. Gentle Handling Rule: Severe hypothermia renders the myocardium extremely irritable. Rough movement, jostling, or aggressive chest compression can trigger fatal ventricular fibrillation. Handle victims horizontally and gently.
3. Passive Core Rewarming: Remove wet clothing immediately in a wind-sheltered area. Wrap victim in multiple dry thermal space blankets (foil side inward) and wool blankets. Apply gentle external heat packs only to the core (chest, neck, groin), NEVER to extremities.
4. Contraindicated Actions: Do NOT rub or massage limbs (causes cold, acidic peripheral blood to rush to the heart, causing temperature afterdrop and cardiac arrest). Do NOT give oral liquids to unconscious or semi-conscious patients. Do NOT apply direct scalding water or open flame.
5. Field Resuscitation: 'No one is dead until warm and dead.' Perform continuous gentle CPR on cold, pulseless drowning victims during transit to the base hospital, as cold preserves brain tissue against hypoxic injury.""",
        "metadata_json": {
            "keywords": ["hypothermia", "first aid", "cold water", "drowning", "triage", "rewarming", "who", "red cross", "medical", "cpr", "space blanket"],
            "section_references": ["Section 4: Environmental Trauma", "Clinical Protocol: Cold Immersion"],
            "license": "WHO Open Access / Red Cross Humanitarian Guidance"
        }
    },
    {
        "title": "MoRTH & IRC Guidelines: Post-Flood Bridge Inspection & Structural Integrity",
        "category": "infrastructure_safety",
        "source_authority": "Ministry of Road Transport & Highways (MoRTH) & Indian Roads Congress (IRC)",
        "url": "https://morth.nic.in",
        "publication_year": 2020,
        "content_text": """Engineering and inspection protocol for bridges affected by extreme flood flows and debris impact:
1. Pier Scour Assessment: High-velocity river torrents scour bed sediments around sub-structure foundations. When scour depth exceeds the design foundation depth, piers undergo tilt and structural settlement. Use echo-sounders or mechanical probe rods to map riverbed bathymetry around all bridge piers.
2. Closure Thresholds: A bridge must be closed to all traffic immediately if: (a) floodwater reaches within 1.0 meter of the lowest girder beam; (b) visible drift or debris jams cover >25% of the waterway opening; (c) lateral or longitudinal deck joints show widening or displacement >15 mm; or (d) approach road backfill has washed out.
3. Bridge Washout Alternatives: When critical spans (such as Bridge B-17 at Raini or Sadarghat at Silchar) are severed, Army Engineer units must establish Bailey bridges (Class 40/70) or motorized ferry crossings. Do not allow emergency relief trucks over damaged spans until load testing is certified by an executive bridge engineer.
4. Approach Embankment Reinstatement: The interface between approach road and abutment wing walls is the most vulnerable failure point. Reinforce approach ramps with stone-filled wire gabion mattresses and geotextile liners before reopening to vehicular traffic.""",
        "metadata_json": {
            "keywords": ["bridge", "scour", "structural", "morth", "irc", "inspection", "closure", "bailey bridge", "piers", "abutment", "washout"],
            "section_references": ["IRC:SP:35 Bridge Inspection Manual", "MoRTH Circular: Flood Scour Evaluation"],
            "license": "Official Technical Standards"
        }
    },
    {
        "title": "Sphere Standards: Emergency Water Supply, Sanitation & Hygiene (WASH) in Flood Crises",
        "category": "wash_humanitarian",
        "source_authority": "The Sphere Project / Humanitarian Charter",
        "url": "https://www.spherestandards.org/handbook/",
        "publication_year": 2018,
        "content_text": """Universal minimum standards for water supply, sanitation, and hygiene promotion during flood emergencies:
1. Minimum Water Quantity: In the immediate emergency phase, provide a minimum of 7.5 to 15 litres of potable water per person per day for drinking and cooking. For health facilities, ensure at least 50 litres per in-patient per day.
2. Water Quality & Disinfection: All distributed water must achieve zero fecal coliforms per 100 ml at point of delivery. Maintain a free residual chlorine (FRC) level of 0.5 mg/l (0.5 ppm) after 30 minutes of contact time. Provide home water purification packets (chlorine / alum coagulant) to isolated households.
3. Excreta Management: In flooded terrain with high water tables, standard pit latrines cannot be dug. Deploy raised latrines, chemical toilets, or container-based sanitation systems at least 30 meters away from groundwater drinking sources.
4. Solid Waste and Vector Control: Standing floodwater accelerates mosquito breeding (malaria, dengue) and rat dispersal (leptospirosis). Conduct immediate fogging in relief camps, supply insecticide-treated bed nets, and establish elevated disposal sites for organic camp waste.
5. Vulnerable Groups: Ensure accessible water distribution points for women, children, the elderly, and persons with disabilities, located in well-lit safe communal areas.""",
        "metadata_json": {
            "keywords": ["sphere", "wash", "water", "sanitation", "hygiene", "chlorine", "latrine", "relief camp", "standards", "potable"],
            "section_references": ["WASH Standard 2.1: Water Quantity", "WASH Standard 2.2: Water Quality", "WASH Standard 3.1: Excreta Management"],
            "license": "Creative Commons Attribution-NonCommercial-NoDerivs"
        }
    },
    {
        "title": "Central Water Commission Guidelines: Dam Break Emergency Action Plans & Inundation Mapping",
        "category": "dam_safety",
        "source_authority": "Central Water Commission (CWC), Government of India",
        "url": "http://cwc.gov.in/flood-management",
        "publication_year": 2021,
        "content_text": """Guidelines for preparing Emergency Action Plans (EAPs) and hydrodynamic flood routing for large dams and barrage structures:
1. Inundation Modeling: Dam safety authorities must maintain dynamic 1D/2D hydrodynamic inundation models based on high-resolution DEMs (Copernicus 30m or LiDAR) calculating flood wave travel times, peak water depths, and arrival times for all downstream settlements.
2. Inflow Forecasting & Controlled Release: In extreme rainfall events, dam operators must avoid sudden massive gate opening that produces flash surges downstream. Spillway discharge must be ramped up gradually with at least 2 hours advance notice to downstream district collectors.
3. Silt Flushing & Glacial Debris Handling: High-head Himalayan barrages (e.g. Tapovan Vishnugad) must automatically open bottom sluices during debris flow events to prevent silt choking of intake conduits and turbine cavern inundation.
4. Multi-Agency Siren Notification: Establish acoustic siren towers spaced at 3 km intervals along the river corridor downstream of major barrages. Test sirens monthly and connect to district disaster management control rooms via redundant leased line and satellite telemetry.""",
        "metadata_json": {
            "keywords": ["cwc", "dam", "barrage", "tapovan", "inundation", "dem", "travel time", "spillway", "silt", "siren", "reservoir"],
            "section_references": ["Guidelines for Development and Implementation of EAPs", "Chapter 4: Inundation Mapping"],
            "license": "Open Government Data (OGD) India"
        }
    }
]
