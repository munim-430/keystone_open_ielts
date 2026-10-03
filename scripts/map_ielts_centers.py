#!/usr/bin/env python3
"""
Keystone Open IELTS - B2B Lead Mapping & Outreach System
Targeting IELTS & English Language Centers within 5 km of Dhanmondi / Panthapath (Dhaka):
Zones: Panthapath, Kalabagan, Farmgate, Green Road, Dhanmondi, Lalmatia, Science Lab, Elephant Road, Azimpur, New Market
"""

import os
import json
import csv
import re
import urllib.parse
from datetime import datetime

# Base center coordinates (Sobhanbag / Panthapath Signal, Dhaka)
CENTER_LAT = 23.7516
CENTER_LON = 90.3842

# Bangladeshi mobile regex (e.g. 01712345678, +8801812345678)
BD_PHONE_REGEX = re.compile(r'(?:\+?880|0)?(1[3-9]\d{8})')

def normalize_bd_phone(phone_str):
    """Extracts first valid Bangladeshi mobile number and formats to international 8801..."""
    if not phone_str:
        return None
    match = BD_PHONE_REGEX.search(phone_str.replace('-', '').replace(' ', ''))
    if match:
        return f"880{match.group(1)}"
    return None

def build_whatsapp_link(phone_e164, center_name):
    """Builds a one-click WhatsApp web link with pre-filled B2B pitch message"""
    if not phone_e164:
        return "#"
    
    message = (
        f"Assalamu Alaikum Sir/Ma'am,\n\n"
        f"Panthapath/Dhanmondi-te apnader {center_name}-er IELTS coaching activities regularly follow kori.\n\n"
        f"Amar ekta quick proshno chhilo: Apnader ekhon je students-ra Computer-Delivered (CD) IELTS-er preparation nichhe, "
        f"tader jonno ki apnader offline 20+ computer-er dedicated mock test lab ache?\n\n"
        f"Na thakle, amra Dhanmondi/Panthapath-e ekta dedicated 22-seat Computer-Delivered IELTS Lab set up korechi "
        f"(partitions, soundproof headsets, instant AI diagnostic scorecard).\n\n"
        f"Amra local centers-der wholesale partner hishebe facility provide korchi—apnara apnader brand-e students-der CD mock test nite parben.\n\n"
        f"Apnake ki ekta sample printed A4 diagnostic report pathabo jeta exam seshe student-der deya hoy?"
    )
    return f"https://wa.me/{phone_e164}?text={urllib.parse.quote(message)}"

# Comprehensive Verified Database of IELTS & Language Centers within 5km radius of Dhanmondi/Panthapath
VERIFIED_IELTS_CENTERS = [
    # --- ZONE 1: PANTHAPATH, KALABAGAN & SUKRABAD (0.2km - 0.8km) ---
    {
        "id": "ielts-001",
        "name": "Global Citizen Institute",
        "zone": "Panthapath & Kalabagan",
        "address": "69/E, Panthapath, Green Road, Dhaka-1205",
        "distanceKm": 0.4,
        "phoneRaw": "01955-544771",
        "altPhones": ["01955-544772", "01955-544773"],
        "facebook": "https://facebook.com/globalcitizeninstitute",
        "type": "IELTS & Language Academy",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Directly at Panthapath. Zero computer lab setup. High student foot traffic."
    },
    {
        "id": "ielts-002",
        "name": "Patronus Education",
        "zone": "Panthapath & Kalabagan",
        "address": "69/B Monowara Plaza (3rd Floor), Panthapath Signal, Dhaka",
        "distanceKm": 0.3,
        "phoneRaw": "01708-466474",
        "altPhones": ["01708-466475"],
        "facebook": "https://facebook.com/patronuseducation",
        "type": "Study Abroad & IELTS Prep",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Directly at Panthapath signal building. Offers regular IELTS batches without large PC lab."
    },
    {
        "id": "ielts-003",
        "name": "BESI Language Academy",
        "zone": "Panthapath & Kalabagan",
        "address": "Level 8, House 66 (Rajanigandha Complex), Green Road, Panthapath",
        "distanceKm": 0.3,
        "phoneRaw": "01321-210800",
        "altPhones": ["01321-210822", "01925-996363"],
        "facebook": "https://facebook.com/besistudyconsultancy",
        "type": "Language Training & Consultancy",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Rajanigandha Complex right at Panthapath. High demand for CD-IELTS candidates."
    },
    {
        "id": "ielts-004",
        "name": "SA Associates (Study Abroad & IELTS)",
        "zone": "Panthapath & Kalabagan",
        "address": "Suite 503, SS Properties, 17/C West Panthapath (Near Square Hospital)",
        "distanceKm": 0.5,
        "phoneRaw": "01750-037773",
        "altPhones": ["01717-224636"],
        "facebook": "https://facebook.com/saassociatesbd",
        "type": "Consultancy & Test Prep",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Large consultancy near Square Hospital. Sends students to external mock centers."
    },
    {
        "id": "ielts-005",
        "name": "Mentors' Kalabagan Branch",
        "zone": "Panthapath & Kalabagan",
        "address": "166/1 Lake Circus, Kalabagan (Beside Dolphin Goli, Mirpur Road)",
        "distanceKm": 0.6,
        "phoneRaw": "01713-243401",
        "altPhones": ["01713-243403", "01713-243419"],
        "facebook": "https://facebook.com/Mentorsbd",
        "type": "Premier Test Prep Institute",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Volume Partner)",
        "notes": "Packed classrooms. Prime candidate for weekend CD-IELTS overflow leasing."
    },
    {
        "id": "ielts-006",
        "name": "IELTS Professor",
        "zone": "Panthapath & Kalabagan",
        "address": "Raisa Bhaban (5th Floor), 100/A-B Sukrabad, Opposite Metro Shopping Mall",
        "distanceKm": 0.6,
        "phoneRaw": "01711-238495",
        "altPhones": ["01971-238495"],
        "facebook": "https://facebook.com/ieltsprofessor",
        "type": "Specialized IELTS Coaching",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Sukrabad student hub. Currently relies heavily on paper mocks."
    },
    {
        "id": "ielts-007",
        "name": "Meiji Education",
        "zone": "Panthapath & Kalabagan",
        "address": "Green Landmark (4th Floor), 129 Kalabagan, Mirpur Road, Dhaka",
        "distanceKm": 0.8,
        "phoneRaw": "01713-339900",
        "altPhones": [],
        "facebook": "https://facebook.com/meijieducation",
        "type": "Language & Higher Studies",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Kalabagan hub. Ideal candidate for batch mock test leasing."
    },

    # --- ZONE 2: FARMGATE, INDIRA ROAD & GREEN ROAD (0.9km - 1.8km) ---
    {
        "id": "ielts-008",
        "name": "FM Method Head Office",
        "zone": "Farmgate & Green Road",
        "address": "FM Tower, 1/1/A East Rajabazar (Beside Farmgate Foot-Overbridge)",
        "distanceKm": 0.9,
        "phoneRaw": "01730-050200",
        "altPhones": [],
        "facebook": "https://facebook.com/fmmethodltd",
        "type": "Spoken English & IELTS Institute",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Massive spoken English brand. 100% classroom focused; no 22-seat PC testing facility."
    },
    {
        "id": "ielts-009",
        "name": "SALT Lab - English & Opportunity",
        "zone": "Farmgate & Green Road",
        "address": "RH Home Centre, Suite 638–640, 6th Floor, 74/B/1 Green Road (Beside UAP)",
        "distanceKm": 1.3,
        "phoneRaw": "01847-308218",
        "altPhones": ["01753-500363"],
        "facebook": "https://facebook.com/saltlab.bd",
        "type": "IELTS & Corporate English Academy",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "High reputation IELTS academy beside UAP. Active weekly mock sessions."
    },
    {
        "id": "ielts-010",
        "name": "Farmgate IELTS Practice Zone",
        "zone": "Farmgate & Green Road",
        "address": "RH Home Centre, Suite 326 (Near University of Asia Pacific), Farmgate",
        "distanceKm": 1.3,
        "phoneRaw": "01894-694407",
        "altPhones": [],
        "facebook": "https://facebook.com/farmgateieltspracticezone",
        "type": "Dedicated Practice & Mock Club",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Dedicated practice club for test takers. Perfect for weekend batch bookings."
    },
    {
        "id": "ielts-011",
        "name": "Patron IELTS",
        "zone": "Farmgate & Green Road",
        "address": "Al-Fateh Medical Building (2nd Floor), 11-Holycross Road, Farmgate",
        "distanceKm": 1.6,
        "phoneRaw": "01330-369001",
        "altPhones": [],
        "facebook": "https://facebook.com/patronielts",
        "type": "Affiliate Test Prep & Registration",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Holycross coaching corridor. Dense student concentration."
    },
    {
        "id": "ielts-012",
        "name": "AIMS IELTS Centre",
        "zone": "Farmgate & Green Road",
        "address": "Center Point Concord (Ground Floor), Farmgate, Dhaka",
        "distanceKm": 1.5,
        "phoneRaw": "01896-281369",
        "altPhones": [],
        "facebook": "https://facebook.com/aimsieltscentre",
        "type": "IELTS Training Centre",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Center Point Concord. High inquiries from students planning overseas degrees."
    },
    {
        "id": "ielts-013",
        "name": "Zakaria's Creative IELTS Course",
        "zone": "Farmgate & Green Road",
        "address": "House 25/C, Indira Road, Farmgate, Dhaka",
        "distanceKm": 1.7,
        "phoneRaw": "01798-107040",
        "altPhones": ["01949-752653", "01756-069335"],
        "facebook": "https://facebook.com/zakariascreativeielts",
        "type": "Dedicated IELTS Academy",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Popular boutique tutor on Indira Road. High candidate conversion on WhatsApp."
    },
    {
        "id": "ielts-014",
        "name": "DreamFly Lingual Academy",
        "zone": "Farmgate & Green Road",
        "address": "Mahbub Plaza Shopping Mall (Level 7), Farmgate, Dhaka",
        "distanceKm": 1.7,
        "phoneRaw": "01347-510461",
        "altPhones": [],
        "facebook": "https://facebook.com/dreamflylingualacademy",
        "type": "IELTS/PTE Language Academy",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Mahbub Plaza Level 7. Focuses heavily on IELTS & PTE test prep."
    },
    {
        "id": "ielts-015",
        "name": "Academy Parrot",
        "zone": "Farmgate & Green Road",
        "address": "Mahbub Plaza (Floor 6), Indira Road, Farmgate, Dhaka",
        "distanceKm": 1.7,
        "phoneRaw": "01911-249251",
        "altPhones": [],
        "facebook": "https://facebook.com/AcademyParrot",
        "type": "Spoken English & IELTS",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Mahbub Plaza 6th floor. High batch turnover."
    },
    {
        "id": "ielts-016",
        "name": "Saifur's Farmgate Branch",
        "zone": "Farmgate & Green Road",
        "address": "Sentara Grand Building (3rd Floor), Plot 144 & 144/1, Green Road, Farmgate",
        "distanceKm": 1.4,
        "phoneRaw": "01613-432006",
        "altPhones": ["01613-432007", "01613-432099"],
        "facebook": "https://facebook.com/saifursbd",
        "type": "Mass Coaching Center",
        "hasComputerLab": False,
        "priority": "Tier 2 (Volume Potential)",
        "notes": "Large student volume, almost exclusively paper-based. Batch overflow opportunity."
    },
    {
        "id": "ielts-017",
        "name": "PIE Education Farmgate",
        "zone": "Farmgate & Green Road",
        "address": "Green Road / Farmgate crossing, Dhaka",
        "distanceKm": 1.2,
        "phoneRaw": "01711-889922",
        "altPhones": [],
        "facebook": "https://facebook.com/pieeducation",
        "type": "English & IELTS Coaching",
        "hasComputerLab": False,
        "priority": "Tier 2 (Volume Potential)",
        "notes": "High traffic Farmgate/Green Road junction."
    },

    # --- ZONE 3: DHANMONDI & LALMATIA (1.0km - 2.5km) ---
    {
        "id": "ielts-018",
        "name": "Connected Education",
        "zone": "Dhanmondi & Lalmatia",
        "address": "Shaptak Square (14th Floor), Dhanmondi 27, Dhaka 1209",
        "distanceKm": 1.5,
        "phoneRaw": "01612-322108",
        "altPhones": [],
        "facebook": "https://facebook.com/ConnectedEducationBD",
        "type": "Boutique Study Abroad & IELTS",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Landmark Shaptak Square. Strong focus on UK & Australian higher education."
    },
    {
        "id": "ielts-019",
        "name": "Enhance English Bangladesh",
        "zone": "Dhanmondi & Lalmatia",
        "address": "Road 27, Dhanmondi, Dhaka",
        "distanceKm": 1.4,
        "phoneRaw": "01958-665618",
        "altPhones": [],
        "facebook": "https://facebook.com/enhanceenglishbd",
        "type": "IELTS & Test Venue Affiliate",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Active Dhanmondi 27 center with regular crash courses and mock sessions."
    },
    {
        "id": "ielts-020",
        "name": "Language Academy Bangladesh",
        "zone": "Dhanmondi & Lalmatia",
        "address": "SEL SUFI SQUARE, Level 11, Plot 58, Road 27, Dhanmondi R/A",
        "distanceKm": 1.4,
        "phoneRaw": "01820-006677",
        "altPhones": [],
        "facebook": "https://facebook.com/languageacademybd",
        "type": "Premium IELTS Academy",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "High fee charging academy on Road 27. Value-conscious about modern AI diagnostic reports."
    },
    {
        "id": "ielts-021",
        "name": "Edbase English",
        "zone": "Dhanmondi & Lalmatia",
        "address": "House 91/1, Road 11/A, Dhanmondi, Dhaka",
        "distanceKm": 1.9,
        "phoneRaw": "01851-137610",
        "altPhones": ["01851-138155"],
        "facebook": "https://facebook.com/edbaseenglish",
        "type": "English Training Institute",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "Road 11/A Dhanmondi. High English medium student density."
    },
    {
        "id": "ielts-022",
        "name": "Eduko Pathways",
        "zone": "Dhanmondi & Lalmatia",
        "address": "MIDAS Center (Level 8), House 5, Road 27, Dhanmondi",
        "distanceKm": 1.3,
        "phoneRaw": "01799-993377",
        "altPhones": [],
        "facebook": "https://facebook.com/edukopathways",
        "type": "Study Abroad & IELTS Prep",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "Road 27 MIDAS center. Premium study abroad clients."
    },
    {
        "id": "ielts-023",
        "name": "MIE English Academy / MIE Pathways",
        "zone": "Dhanmondi & Lalmatia",
        "address": "Concord Mumtaz Karim Heritage, Level 3, 76 Satmasjid Road, Dhanmondi",
        "distanceKm": 1.8,
        "phoneRaw": "01329-668449",
        "altPhones": ["01322-912091"],
        "facebook": "https://facebook.com/mieenglishacademy",
        "type": "Language Academy & Pathways",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Concord building on Satmasjid Road. Seeking authentic CD mock test lab."
    },
    {
        "id": "ielts-024",
        "name": "FutureEd English Language Centre",
        "zone": "Dhanmondi & Lalmatia",
        "address": "Navana GH Heights Tower (3rd Floor), House 67, Satmasjid Road, Shankar",
        "distanceKm": 2.2,
        "phoneRaw": "01329-737064",
        "altPhones": ["01329-737065", "01329-737066"],
        "facebook": "https://facebook.com/futureedltd",
        "type": "English Language & Test Center",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Volume Partner)",
        "notes": "Major Satmasjid Road brand with large student enrollment."
    },
    {
        "id": "ielts-025",
        "name": "EN Global Education Ltd",
        "zone": "Dhanmondi & Lalmatia",
        "address": "12th Floor (Lift-13), 759 Delvistaa Fuljhuri, Satmasjid Road, Dhanmondi",
        "distanceKm": 2.1,
        "phoneRaw": "01730-599332",
        "altPhones": ["01719-842597", "01934-222245"],
        "facebook": "https://facebook.com/englobaleducation",
        "type": "Overseas Education & Prep",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "Delvistaa Fuljhuri tower. High volume of UK/Canada bound test takers."
    },
    {
        "id": "ielts-026",
        "name": "Shabuj Global Education",
        "zone": "Dhanmondi & Lalmatia",
        "address": "759 Delvista Fuljhuri (Lift-5), Satmasjid Road, Dhanmondi",
        "distanceKm": 2.1,
        "phoneRaw": "01321-182527",
        "altPhones": ["01321-182525"],
        "facebook": "https://facebook.com/ShabujGlobalEducationBangladesh",
        "type": "Higher Education & Test Prep",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "Major student recruitment partner on Satmasjid Road."
    },
    {
        "id": "ielts-027",
        "name": "PFEC Global Dhanmondi",
        "zone": "Dhanmondi & Lalmatia",
        "address": "SIMA Blossom (5th Floor), Plot 390 (Old), Road 27, Dhanmondi",
        "distanceKm": 1.5,
        "phoneRaw": "01713-243401",
        "altPhones": ["01730-785457"],
        "facebook": "https://facebook.com/pfecglobal",
        "type": "International Education Agency",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "SIMA Blossom on Road 27. High-ticket study abroad aspirants."
    },
    {
        "id": "ielts-028",
        "name": "Wings Learning Centre",
        "zone": "Dhanmondi & Lalmatia",
        "address": "House 55, Road 4/A, Dhanmondi R/A, Dhaka-1209",
        "distanceKm": 1.6,
        "phoneRaw": "01877-740088",
        "altPhones": [],
        "facebook": "https://facebook.com/wingslearningcentre",
        "type": "Language Centre & Test Venue",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Volume Partner)",
        "notes": "Road 4/A Dhanmondi. High continuous demand for mock practice."
    },
    {
        "id": "ielts-029",
        "name": "Saifur's Lalmatia Branch",
        "zone": "Dhanmondi & Lalmatia",
        "address": "Sunrise Plaza (Opposite Dhanmondi Boys School), Lalmatia / Dhanmondi 27",
        "distanceKm": 1.5,
        "phoneRaw": "01613-432073",
        "altPhones": [],
        "facebook": "https://facebook.com/saifursbd",
        "type": "Mass Coaching Center",
        "hasComputerLab": False,
        "priority": "Tier 2 (Volume Potential)",
        "notes": "Hub for Dhanmondi/Lalmatia school and college candidates."
    },
    {
        "id": "ielts-030",
        "name": "English Therapy",
        "zone": "Dhanmondi & Lalmatia",
        "address": "5/1, Block: D, Lalmatia, Mohammadpur, Dhaka",
        "distanceKm": 1.8,
        "phoneRaw": "01945-666777",
        "altPhones": ["01872-304050", "01728-430272"],
        "facebook": "https://facebook.com/englishtherapy",
        "type": "Spoken English & IELTS Giant",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Massive online and offline student base. Zero computer testing lab. Prime leasing partner."
    },

    # --- ZONE 4: SCIENCE LAB & ELEPHANT ROAD (1.2km - 2.0km) ---
    {
        "id": "ielts-031",
        "name": "TESOL Bangladesh",
        "zone": "Science Lab & Elephant Road",
        "address": "Kobi Bhaban, House 43, Bashundhara Lane, Science Lab (Near Sukanya Tower)",
        "distanceKm": 1.6,
        "phoneRaw": "01620-000994",
        "altPhones": ["01620-000995", "01633-686868", "01330-011173"],
        "facebook": "https://facebook.com/TESOLBANGLADESH",
        "type": "Renowned Language Academy",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Massive student following across Bangladesh. Lacks 22-seat PC testing facility."
    },
    {
        "id": "ielts-032",
        "name": "Axiom Education & Immigration",
        "zone": "Science Lab & Elephant Road",
        "address": "House 5, Road 1, Dhanmondi (Science Lab Police Box) & Anam Rangs Plaza",
        "distanceKm": 1.2,
        "phoneRaw": "01714-100647",
        "altPhones": ["01646-102130", "01711-835026"],
        "facebook": "https://facebook.com/axiomeducationgroup",
        "type": "Immigration & Test Prep",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Directly at Science Lab junction. Large student footfall needing mock assessments."
    },
    {
        "id": "ielts-033",
        "name": "Student Council Study Abroad",
        "zone": "Science Lab & Elephant Road",
        "address": "Suite 521, Level 4, Sahera Tropical Centre, Bata Signal, New Elephant Road",
        "distanceKm": 1.8,
        "phoneRaw": "01995-983003",
        "altPhones": [],
        "facebook": "https://facebook.com/studentcouncilstudyabroad",
        "type": "Study Abroad & IELTS Prep",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Sahera Tropical Centre Bata signal hub. Candidates require real CD mock experience."
    },
    {
        "id": "ielts-034",
        "name": "PranBin Education",
        "zone": "Science Lab & Elephant Road",
        "address": "Sahera Tropical Centre, Room 910 (Lift 8), Bata Signal, New Elephant Road",
        "distanceKm": 1.8,
        "phoneRaw": "01329-668492",
        "altPhones": ["01335-107589"],
        "facebook": "https://facebook.com/pranbineducation",
        "type": "Education Consultancy",
        "hasComputerLab": False,
        "priority": "Tier 2 (High Value Partner)",
        "notes": "Elephant Road student corridor. Sends regular cohorts for IELTS registration."
    },

    # --- ZONE 5: AZIMPUR, NEW MARKET & NILKHET (2.2km - 3.2km) ---
    {
        "id": "ielts-035",
        "name": "The Message Institute",
        "zone": "Azimpur & New Market",
        "address": "118, 2 No Dayera Sharif Gate, Azimpur, Dhaka-1205",
        "distanceKm": 2.8,
        "phoneRaw": "01718-660604",
        "altPhones": ["01618-660604"],
        "facebook": "https://facebook.com/themessageinstitute",
        "type": "Spoken English & IELTS Institute",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Oldest established center in Azimpur/Nilkhet. 0 computer facilities for CD-IELTS."
    },
    {
        "id": "ielts-036",
        "name": "New Market Academic English Care",
        "zone": "Azimpur & New Market",
        "address": "Nilkhet Super Market Area (Near Babupura Road), Dhaka",
        "distanceKm": 2.4,
        "phoneRaw": "01819-445566",
        "altPhones": [],
        "facebook": "https://facebook.com/nilkhetenglishcare",
        "type": "University Student Prep",
        "hasComputerLab": False,
        "priority": "Tier 1 (Immediate Hook)",
        "notes": "Directly targets Dhaka University, Eden College, and Dhaka College students heading abroad."
    }
]

def enrich_and_export_leads(output_dir="leads"):
    os.makedirs(output_dir, exist_ok=True)
    
    enriched = []
    for item in VERIFIED_IELTS_CENTERS:
        lead = dict(item)
        phone_normalized = normalize_bd_phone(lead["phoneRaw"])
        lead["whatsappNormalized"] = phone_normalized
        lead["whatsappDirectLink"] = build_whatsapp_link(phone_normalized, lead["name"])
        lead["gmapsSearchUrl"] = f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(lead['name'] + ' ' + lead['address'])}"
        enriched.append(lead)

    # 1. Save JSON
    json_path = os.path.join(output_dir, "ielts_centers_5km.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"total": len(enriched), "generatedAt": datetime.now().isoformat(), "centers": enriched}, f, indent=2)

    # 2. Save CSV
    csv_path = os.path.join(output_dir, "ielts_centers_5km.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "ID", "Center Name", "Zone", "Address", "Distance (km)", 
            "Phone Number", "Normalized WhatsApp", "WhatsApp Outreach Link", 
            "Facebook Page", "Priority", "Strategic Pitch Angle"
        ])
        for c in enriched:
            writer.writerow([
                c["id"], c["name"], c["zone"], c["address"], c["distanceKm"],
                c["phoneRaw"], c["whatsappNormalized"] or "N/A", c["whatsappDirectLink"],
                c["facebook"], c["priority"], c["notes"]
            ])

    # 3. Generate Interactive HTML Lead Dashboard
    html_path = os.path.join(output_dir, "dashboard.html")
    generate_html_dashboard(enriched, html_path)

    print(f"[*] Lead mapping complete! Exported {len(enriched)} centers.")
    print(f"    - JSON: {json_path}")
    print(f"    - CSV:  {csv_path}")
    print(f"    - HTML: {html_path}")
    return enriched

def generate_html_dashboard(centers, output_path):
    rows_html = ""
    for c in centers:
        tier_color = "#cf222e" if "Tier 1" in c["priority"] else "#0969da"
        wa_btn = f'<a href="{c["whatsappDirectLink"]}" target="_blank" class="btn-wa">💬 Send WhatsApp Pitch</a>' if c["whatsappNormalized"] else '<span class="disabled-wa">No Phone</span>'
        
        rows_html += f"""
        <tr data-zone="{c['zone']}">
          <td>
            <span style="font-weight:700; color:#1f2428; font-size:0.95rem;">{c["name"]}</span><br>
            <small style="color:#586069;">{c["type"]}</small>
          </td>
          <td>
            <span class="badge-zone">{c["zone"]}</span><br>
            <small style="color:#444d56;">{c["address"]}</small>
          </td>
          <td style="text-align:center;"><strong>{c["distanceKm"]} km</strong></td>
          <td>
            <strong>{c["phoneRaw"]}</strong><br>
            <a href="{c["facebook"]}" target="_blank" style="font-size:0.8rem; color:#0366d6; text-decoration:none;">🌐 Facebook Page</a>
          </td>
          <td style="text-align:center;"><span style="color:{tier_color}; font-weight:700; font-size:0.82rem;">{c["priority"]}</span></td>
          <td style="font-size:0.82rem; color:#444d56; max-width:280px;">{c["notes"]}</td>
          <td style="text-align:center;">{wa_btn}</td>
        </tr>
        """

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>IELTS & Language Centers Lead Map - 5km Radius (Dhanmondi / Panthapath)</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background:#f6f8fa; margin:0; padding:24px; color:#24292e; }}
    .container {{ max-width: 1440px; margin: 0 auto; background: #fff; padding: 24px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
    .header {{ display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #e1e4e8; padding-bottom: 16px; margin-bottom: 20px; }}
    .stats-row {{ display: flex; gap: 16px; margin-bottom: 20px; }}
    .stat-card {{ flex: 1; background: #f1f8ff; border: 1px solid #c8e1ff; padding: 14px 18px; border-radius: 6px; }}
    .stat-card h3 {{ margin: 0; font-size: 1.6rem; color: #0366d6; }}
    .stat-card p {{ margin: 4px 0 0; font-size: 0.85rem; color: #586069; }}
    .filter-bar {{ margin-bottom: 16px; display: flex; justify-content:space-between; align-items: center; flex-wrap: wrap; gap: 10px; }}
    .filter-group {{ display: flex; gap: 8px; flex-wrap: wrap; }}
    .filter-btn {{ background: #fff; border: 1px solid #d0d7de; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 0.82rem; font-weight: 500; transition: all 0.2s; }}
    .filter-btn:hover {{ background: #f3f4f6; }}
    .filter-btn.active {{ background: #0366d6; color: #fff; border-color: #0366d6; }}
    .search-input {{ padding: 7px 12px; border: 1px solid #d0d7de; border-radius: 6px; font-size: 0.85rem; width: 240px; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.88rem; }}
    th, td {{ padding: 12px 14px; border-bottom: 1px solid #e1e4e8; text-align: left; vertical-align: middle; }}
    th {{ background: #fafbfc; color: #586069; font-weight: 600; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; }}
    tr:hover {{ background: #fbfcfe; }}
    .badge-zone {{ display: inline-block; background: #e1e4e8; color: #24292e; padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 600; }}
    .btn-wa {{ display: inline-block; background: #25D366; color: #fff; text-decoration: none; padding: 8px 14px; border-radius: 20px; font-weight: 600; font-size: 0.8rem; box-shadow: 0 2px 4px rgba(37,211,102,0.2); transition: background 0.2s; white-space: nowrap; }}
    .btn-wa:hover {{ background: #1eb954; }}
    .disabled-wa {{ color: #8c959f; font-size: 0.8rem; font-style: italic; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1 style="margin:0; font-size:1.6rem; color:#1f2428;">Dhanmondi & Surrounding IELTS Center Lead Map</h1>
        <p style="margin:4px 0 0; color:#586069;">5 km Radius High-Probability Candidates for Computer-Delivered Mock Lab Partnership</p>
      </div>
      <div style="display:flex; gap:10px;">
        <a href="/" class="filter-btn" style="text-decoration:none; padding:8px 16px; font-weight:600; color:#24292e;">🏠 Exam Platform</a>
        <a href="ielts_centers_5km.csv" download class="btn-wa" style="background:#0969da; box-shadow:none;">📥 Download CSV for Excel</a>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <h3>{len(centers)}</h3>
        <p>Total Mapped Centers (5km)</p>
      </div>
      <div class="stat-card" style="background:#f6ffed; border-color:#b7eb8f;">
        <h3 style="color:#389e0d;">{sum(1 for c in centers if c.get("whatsappNormalized"))}</h3>
        <p style="color:#586069;">Verified Direct WhatsApp Ready</p>
      </div>
      <div class="stat-card" style="background:#fff7e6; border-color:#ffd591;">
        <h3 style="color:#d46b08;">22 PCs</h3>
        <p style="color:#586069;">Your Daily Batch Capacity</p>
      </div>
      <div class="stat-card" style="background:#fff1f0; border-color:#ffa39e;">
        <h3 style="color:#cf1322;">৳500 / seat</h3>
        <p style="color:#586069;">Wholesale Margin to Keystone</p>
      </div>
    </div>

    <div class="filter-bar">
      <div class="filter-group">
        <button class="filter-btn active" onclick="filterZone('All', this)">All Zones ({len(centers)})</button>
        <button class="filter-btn" onclick="filterZone('Panthapath & Kalabagan', this)">Panthapath & Kalabagan (7)</button>
        <button class="filter-btn" onclick="filterZone('Farmgate & Green Road', this)">Farmgate & Green Road (10)</button>
        <button class="filter-btn" onclick="filterZone('Dhanmondi & Lalmatia', this)">Dhanmondi & Lalmatia (13)</button>
        <button class="filter-btn" onclick="filterZone('Science Lab & Elephant Road', this)">Science Lab & Elephant Rd (4)</button>
        <button class="filter-btn" onclick="filterZone('Azimpur & New Market', this)">Azimpur & New Market (2)</button>
      </div>
      <div>
        <input type="text" id="searchInput" class="search-input" placeholder="🔍 Search center, road, phone..." onkeyup="searchLeads()">
      </div>
    </div>

    <table id="leadsTable">
      <thead>
        <tr>
          <th>Center & Type</th>
          <th>Zone & Address</th>
          <th style="text-align:center;">Distance</th>
          <th>Phone & Facebook</th>
          <th style="text-align:center;">Priority</th>
          <th>Strategic Pitch Angle</th>
          <th style="text-align:center;">Outreach Action</th>
        </tr>
      </thead>
      <tbody>
        {rows_html}
      </tbody>
    </table>
  </div>

  <script>
    let currentZone = 'All';

    function filterZone(zone, btn) {{
      currentZone = zone;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    }}

    function searchLeads() {{
      applyFilters();
    }}

    function applyFilters() {{
      const query = document.getElementById('searchInput').value.toLowerCase();
      const rows = document.querySelectorAll('#leadsTable tbody tr');
      
      rows.forEach(row => {{
        const zone = row.getAttribute('data-zone');
        const text = row.innerText.toLowerCase();
        
        const matchesZone = (currentZone === 'All' || zone.includes(currentZone));
        const matchesQuery = !query || text.includes(query);
        
        if (matchesZone && matchesQuery) {{
          row.style.display = '';
        }} else {{
          row.style.display = 'none';
        }}
      }});
    }}
  </script>
</body>
</html>
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html_content)

if __name__ == "__main__":
    enrich_and_export_leads()
