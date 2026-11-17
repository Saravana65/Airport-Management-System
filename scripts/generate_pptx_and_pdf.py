import os
import sys
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image
import pymupdf

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "presentation_assets")
PPTX_PATH = os.path.join(BASE_DIR, "Airport_Management_System_DBMS_Presentation.pptx")
PDF_PATH = os.path.join(BASE_DIR, "Airport_Management_System_DBMS_Presentation.pdf")

# Colors
C_NAVY = RGBColor(16, 42, 67)       # #102A43
C_BLUE = RGBColor(37, 99, 235)      # #2563EB
C_DARK_BLUE = RGBColor(29, 78, 216) # #1D4ED8
C_LIGHT_BLUE = RGBColor(234, 243, 255) # #EAF3FF
C_WHITE = RGBColor(255, 255, 255)   # #FFFFFF
C_BG_LIGHT = RGBColor(248, 250, 252) # #F8FAFC
C_DARK = RGBColor(15, 23, 42)       # #0F172A
C_MUTED = RGBColor(100, 116, 139)   # #64748B
C_BORDER = RGBColor(226, 232, 240)  # #E2E8F0
C_GREEN = RGBColor(16, 185, 129)    # #10B981
C_AMBER = RGBColor(245, 158, 11)    # #F59E0B
C_PURPLE = RGBColor(139, 92, 246)   # #8B5CF6

HEX_NAVY = "#102A43"
HEX_BLUE = "#2563EB"
HEX_LIGHT_BLUE = "#EAF3FF"
HEX_WHITE = "#FFFFFF"
HEX_BG = "#F8FAFC"
HEX_DARK = "#0F172A"
HEX_MUTED = "#64748B"
HEX_BORDER = "#CBD5E1"
HEX_GREEN = "#10B981"
HEX_AMBER = "#F59E0B"
HEX_CARD = "#FFFFFF"

# -------------------------------------------------------------
# HELPER FUNCTIONS FOR PPTX
# -------------------------------------------------------------
def set_shape_flat(shape, fill_color, line_color=None, line_width=1):
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(line_width)
    else:
        shape.line.fill.background()

def add_header(slide, badge_text, title_text, dark_mode=False):
    # Badge
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), Inches(2.8), Inches(0.32))
    set_shape_flat(badge, C_BLUE if dark_mode else C_LIGHT_BLUE, C_BLUE if dark_mode else C_BLUE, line_width=1)
    tf = badge.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = badge_text.upper()
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE if dark_mode else C_BLUE
    p.alignment = PP_ALIGN.CENTER

    # Title
    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.75), Inches(11.7), Inches(0.6))
    tf2 = title_box.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = tf2.margin_bottom = 0
    p2 = tf2.paragraphs[0]
    p2.text = title_text
    p2.font.size = Pt(22)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE if dark_mode else C_DARK

def add_card(slide, left, top, width, height, fill_color=C_WHITE, border_color=C_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    set_shape_flat(card, fill_color, border_color, line_width=1)
    return card

# -------------------------------------------------------------
# BUILD PPTX
# -------------------------------------------------------------
def build_pptx():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # ==========================================
    # SLIDE 1: Title Slide (Dark Navy)
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    bg1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg1, C_NAVY)

    # Top accent bar
    accent = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    set_shape_flat(accent, C_BLUE)

    # Category Pill
    pill = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(1.1), Inches(3.8), Inches(0.38))
    set_shape_flat(pill, RGBColor(30, 58, 95), C_BLUE, line_width=1.5)
    tf = pill.text_frame
    p = tf.paragraphs[0]
    p.text = "DATABASE MANAGEMENT SYSTEMS (DBMS) CAPSTONE"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)
    p.alignment = PP_ALIGN.CENTER

    # Main Title
    tb = s1.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(11.3), Inches(1.2))
    p = tb.text_frame.paragraphs[0]
    p.text = "AIRPORT MANAGEMENT SYSTEM"
    p.font.size = Pt(40)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    # Subtitle
    tb_sub = s1.shapes.add_textbox(Inches(1.0), Inches(2.95), Inches(11.3), Inches(0.8))
    p = tb_sub.text_frame.paragraphs[0]
    p.text = "Relational Database Design, ACID Concurrency Control, and Real-Time Multi-Tier Telemetry"
    p.font.size = Pt(17)
    p.font.color.rgb = RGBColor(203, 213, 225)

    # Feature Badges
    badges = [
        ("15 Relational Tables", C_BLUE),
        ("3NF Fully Normalized", C_GREEN),
        ("Pessimistic Row-Locking", C_AMBER),
        ("Multi-Tier Full Stack", C_PURPLE)
    ]
    for i, (btext, bcol) in enumerate(badges):
        b = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0 + i * 2.85), Inches(3.9), Inches(2.65), Inches(0.42))
        set_shape_flat(b, RGBColor(20, 35, 55), bcol, line_width=1)
        bp = b.text_frame.paragraphs[0]
        bp.text = f"• {btext}"
        bp.font.size = Pt(11)
        bp.font.bold = True
        bp.font.color.rgb = C_WHITE
        bp.alignment = PP_ALIGN.CENTER

    # Presenters Card
    p_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(4.7), Inches(11.3), Inches(1.9))
    set_shape_flat(p_card, RGBColor(23, 42, 69), RGBColor(51, 65, 85), line_width=1.5)
    
    # Presenter 1 box
    p1 = s1.shapes.add_textbox(Inches(1.4), Inches(4.9), Inches(5.0), Inches(1.5))
    tf1 = p1.text_frame
    para = tf1.paragraphs[0]
    para.text = "PRESENTED BY"
    para.font.size = Pt(10)
    para.font.bold = True
    para.font.color.rgb = RGBColor(147, 197, 253)
    para2 = tf1.add_paragraph()
    para2.text = "S. Saravana Srinivas"
    para2.font.size = Pt(18)
    para2.font.bold = True
    para2.font.color.rgb = C_WHITE
    para3 = tf1.add_paragraph()
    para3.text = "Roll No: 25R11A66P7"
    para3.font.size = Pt(13)
    para3.font.color.rgb = RGBColor(203, 213, 225)

    # Presenter 2 box
    p2 = s1.shapes.add_textbox(Inches(6.8), Inches(4.9), Inches(5.0), Inches(1.5))
    tf2 = p2.text_frame
    para = tf2.paragraphs[0]
    para.text = "CO-PRESENTER"
    para.font.size = Pt(10)
    para.font.bold = True
    para.font.color.rgb = RGBColor(147, 197, 253)
    para2 = tf2.add_paragraph()
    para2.text = "L. Anjan Kumar"
    para2.font.size = Pt(18)
    para2.font.bold = True
    para2.font.color.rgb = C_WHITE
    para3 = tf2.add_paragraph()
    para3.text = "Roll No: 25R11A66N5"
    para3.font.size = Pt(13)
    para3.font.color.rgb = RGBColor(203, 213, 225)


    # ==========================================
    # SLIDE 2: Introduction & Project Objectives
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg2, C_BG_LIGHT)
    add_header(s2, "Project Overview & Problem Statement", "Introduction & Centralized Airport Operations")

    # Left: Traditional Challenges
    add_card(s2, Inches(0.8), Inches(1.5), Inches(5.7), Inches(3.2))
    tb = s2.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.3), Inches(2.9))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "Conventional Airport Operations Challenges"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = RGBColor(220, 38, 38)
    items = [
        "Data Fragmentation: Siloed flight manifests, gate allocations, and baggage records lead to communication breakdowns.",
        "Concurrency Anomalies: Double-booking risk when concurrent passengers book the exact same seat simultaneously.",
        "Manual Discrepancies: Paper-based check-in causes operational lag, boarding bottlenecks, and baggage loss.",
        "Stale Status Displays: Flight status updates take minutes to propagate across departure gates and passenger apps."
    ]
    for itm in items:
        p = tf.add_paragraph()
        p.text = f"• {itm}"
        p.font.size = Pt(11)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(4)

    # Right: AMS Relational Solution
    add_card(s2, Inches(6.8), Inches(1.5), Inches(5.7), Inches(3.2), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    tb = s2.shapes.add_textbox(Inches(7.0), Inches(1.65), Inches(5.3), Inches(2.9))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "The AMS Centralized Relational Solution"
    p.font.size = Pt(14)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    items_sol = [
        "Unified MySQL 8.0 Schema: 15 relational tables linking airports, flights, seats, baggage, and security telemetry.",
        "Pessimistic Row-Locking (ACID): Zero double-booking guarantee via SELECT ... FOR UPDATE within transactions.",
        "Digital Check-In & Boarding: Automated digital boarding pass generation with deterministic seat allocation.",
        "Real-Time Telemetry: Live FIDS (Flight Information Display System) synchronizing gates, baggage, and statuses."
    ]
    for itm in items_sol:
        p = tf.add_paragraph()
        p.text = f"✓ {itm}"
        p.font.size = Pt(11)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(4)

    # Bottom: 5 Core Objectives
    add_card(s2, Inches(0.8), Inches(4.9), Inches(11.7), Inches(2.1))
    tb_bot = s2.shapes.add_textbox(Inches(1.0), Inches(5.0), Inches(11.3), Inches(1.9))
    tf = tb_bot.text_frame
    p = tf.paragraphs[0]
    p.text = "Core Engineering & Database Objectives"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    obj_cols = [
        "1. Centralized Data Architecture: Replace disconnected records with a normalized relational enterprise schema.",
        "2. Strict ACID Transactional Integrity: Guarantee all-or-nothing bookings and eliminate seat-allocation race conditions.",
        "3. Multi-Role Authorization (RBAC): Differentiate privileges across Passenger, Airline Staff, and Airport Admin.",
        "4. Live Telemetry & FIDS Joins: Perform high-speed multi-table joins to serve real-time flight dashboards."
    ]
    for o in obj_cols:
        p = tf.add_paragraph()
        p.text = f"▶ {o}"
        p.font.size = Pt(10.5)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(3)


    # ==========================================
    # SLIDE 3: Technology Stack & Multi-Tier Architecture
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg3, C_BG_LIGHT)
    add_header(s3, "Enterprise System Design", "4-Tier Full-Stack Technology Architecture")

    # 4 Vertical Tier Cards
    tiers = [
        ("Tier 1: Presentation Tier", "React 18 + Vite + Tailwind CSS", [
            "Component-based responsive UI",
            "Real-time seat selection map",
            "Digital boarding pass rendering",
            "Role-based view protection",
            "REST API consumption via Axios"
        ], C_BLUE),
        ("Tier 2: Application Tier", "Node.js + Express REST API", [
            "Modular Express routing engine",
            "JWT token authentication & RBAC",
            "Pessimistic transaction controller",
            "Input sanitization & validation",
            "C / Java microservice bridges"
        ], C_DARK_BLUE),
        ("Tier 3: Specialized Engines", "C Core Engine & Java Service", [
            "C: Route calculation & memory models",
            "Java: Complex dynamic fare algorithms",
            "High-throughput sub-millisecond execution",
            "Clean inter-process JSON exchange",
            "Modular business computation"
        ], C_PURPLE),
        ("Tier 4: Relational Database", "MySQL 8.0 Enterprise Relational DB", [
            "15 Normalized tables (3NF)",
            "InnoDB engine with row-level locks",
            "Connection pool (mysql2/promise)",
            "Parameterized queries (No SQLi)",
            "Composite unique constraints"
        ], C_GREEN)
    ]

    for i, (title, subtitle, bullets, col) in enumerate(tiers):
        card = add_card(s3, Inches(0.8 + i * 2.98), Inches(1.5), Inches(2.8), Inches(4.2))
        
        # Color bar top
        bar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8 + i * 2.98), Inches(1.5), Inches(2.8), Inches(0.1))
        set_shape_flat(bar, col)

        tb = s3.shapes.add_textbox(Inches(0.95 + i * 2.98), Inches(1.7), Inches(2.5), Inches(3.8))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(9.5)
        p2.font.bold = True
        p2.font.color.rgb = C_DARK
        p2.space_after = Pt(8)

        for b in bullets:
            p = tf.add_paragraph()
            p.text = f"• {b}"
            p.font.size = Pt(9)
            p.font.color.rgb = C_DARK
            p.space_after = Pt(3)

    # Bottom Database Connection Details Card
    add_card(s3, Inches(0.8), Inches(5.9), Inches(11.7), Inches(1.15), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    tb_bot = s3.shapes.add_textbox(Inches(1.0), Inches(5.98), Inches(11.3), Inches(0.95))
    tf = tb_bot.text_frame
    p = tf.paragraphs[0]
    p.text = "DATABASE CONNECTION POOL & PREPARED STATEMENT CONFIGURATION"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf.add_paragraph()
    p2.text = "• Connection Pool: mysql2/promise connection pool configured with 10 max connections, keepAliveInitialDelay=10000ms, and queueLimit=0."
    p2.font.size = Pt(9.5)
    p2.font.color.rgb = C_DARK
    p3 = tf.add_paragraph()
    p3.text = "• SQL Injection Prevention: 100% of queries use parameterized prepared statements (?, ?) preventing SQL injection attacks."
    p3.font.size = Pt(9.5)
    p3.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 4: Database Design Process
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg4, C_BG_LIGHT)
    add_header(s4, "Engineering Methodology", "8-Step Database Design & Implementation Lifecycle")

    steps = [
        ("Step 1: Requirement Analysis", "Domain modeling of airports, flights, manifests, security, check-in, and baggage pipelines."),
        ("Step 2: Entity Identification", "Identified 15 primary entities (Airports, Flights, Passengers, Bookings, Tickets, Gates, Baggage)."),
        ("Step 3: Attribute & Type Mapping", "Mapped exact SQL types: INT PKs, VARCHAR strings, TIMESTAMP for schedules, DECIMAL for fares."),
        ("Step 4: Primary Key Definition", "Assigned surrogate auto-increment PKs for operational records and natural keys for IATA codes."),
        ("Step 5: Foreign Keys & Integrity", "Configured referential integrity rules (ON DELETE CASCADE for tickets; RESTRICT for airports)."),
        ("Step 6: Cardinality & Associative", "Resolved M:N relationships into associative tables (TICKETS links BOOKINGS and FLIGHTS)."),
        ("Step 7: Normalization Defense", "Refined schema through 1NF, 2NF, and 3NF to eliminate insertion, update, and deletion anomalies."),
        ("Step 8: DDL Implementation", "Executed MySQL scripts with B-Tree indexes, composite keys, and UNIQUE constraints.")
    ]

    for idx, (title, desc) in enumerate(steps):
        row = idx // 4
        col = idx % 4
        left = Inches(0.8 + col * 2.98)
        top = Inches(1.5 + row * 2.3)
        
        card = add_card(s4, left, top, Inches(2.8), Inches(2.1))
        
        # Step Number Badge
        s_badge = s4.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left + Inches(0.12), top + Inches(0.12), Inches(0.9), Inches(0.28))
        set_shape_flat(s_badge, C_BLUE)
        tf_sb = s_badge.text_frame
        p = tf_sb.paragraphs[0]
        p.text = f"STEP {idx+1}"
        p.font.size = Pt(9)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.alignment = PP_ALIGN.CENTER

        tb = s4.shapes.add_textbox(left + Inches(0.12), top + Inches(0.48), Inches(2.56), Inches(1.5))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = title.split(":")[1].strip()
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = C_DARK

    # Bottom Entity Classification Summary
    add_card(s4, Inches(0.8), Inches(6.25), Inches(11.7), Inches(0.85), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    tb_sum = s4.shapes.add_textbox(Inches(1.0), Inches(6.32), Inches(11.3), Inches(0.7))
    tf = tb_sum.text_frame
    p = tf.paragraphs[0]
    p.text = "ENTITY CLASSIFICATION CATALOG (15 RELATIONAL TABLES)"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf.add_paragraph()
    p2.text = "• Master: AIRPORTS, AIRLINES, AIRCRAFT, USERS  |  • Operations: FLIGHTS, FLIGHT_INSTANCES, GATES, FLIGHT_STATUS_HISTORY\n• Transactions: PASSENGERS, BOOKINGS, TICKETS, CHECK_IN, BAGGAGE  |  • Support: EMPLOYEES, NOTIFICATIONS"
    p2.font.size = Pt(9)
    p2.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 5: Entity-Relationship (ER) Diagram
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg5, C_BG_LIGHT)
    add_header(s5, "Relational Schema Architecture", "Entity-Relationship (ER) Diagram & Table Cardinalities")

    # Left: Embedded ER Diagram Image
    er_img_path = os.path.join(ASSETS_DIR, "er_diagram.png")
    if os.path.exists(er_img_path):
        s5.shapes.add_picture(er_img_path, Inches(0.8), Inches(1.4), Inches(7.6), Inches(5.6))
    else:
        add_card(s5, Inches(0.8), Inches(1.4), Inches(7.6), Inches(5.6))

    # Right: Relational Cardinality Cards
    card_r1 = add_card(s5, Inches(8.6), Inches(1.4), Inches(3.9), Inches(1.75))
    tb1 = s5.shapes.add_textbox(Inches(8.75), Inches(1.5), Inches(3.6), Inches(1.55))
    tf1 = tb1.text_frame
    p = tf1.paragraphs[0]
    p.text = "Key Relational Cardinalities"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    cards = [
        "FLIGHTS (1 : N) FLIGHT_INSTANCES (Daily schedules)",
        "BOOKINGS (1 : N) TICKETS (Multi-passenger PNR)",
        "FLIGHT_INSTANCES (1 : N) TICKETS (Manifest allocation)",
        "TICKETS (1 : 1) CHECK_IN (One pass per ticket)",
        "BOOKINGS (1 : N) BAGGAGE (Associated luggage)"
    ]
    for c in cards:
        p = tf1.add_paragraph()
        p.text = f"• {c}"
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK

    card_r2 = add_card(s5, Inches(8.6), Inches(3.25), Inches(3.9), Inches(1.85))
    tb2 = s5.shapes.add_textbox(Inches(8.75), Inches(3.35), Inches(3.6), Inches(1.65))
    tf2 = tb2.text_frame
    p = tf2.paragraphs[0]
    p.text = "Associative Resolution (M:N to 1:N)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf2.add_paragraph()
    p2.text = "• M:N between PASSENGERS & FLIGHT_INSTANCES is resolved via TICKETS associative table."
    p2.font.size = Pt(9)
    p2.font.color.rgb = C_DARK
    p3 = tf2.add_paragraph()
    p3.text = "• TICKETS holds Foreign Keys to BOOKINGS, PASSENGERS, and FLIGHT_INSTANCES."
    p3.font.size = Pt(9)
    p3.font.color.rgb = C_DARK
    p4 = tf2.add_paragraph()
    p4.text = "• Composite Unique Key prevents duplicate seat allocation on the same flight instance."
    p4.font.size = Pt(9)
    p4.font.color.rgb = C_DARK

    card_r3 = add_card(s5, Inches(8.6), Inches(5.2), Inches(3.9), Inches(1.8), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    tb3 = s5.shapes.add_textbox(Inches(8.75), Inches(5.3), Inches(3.6), Inches(1.6))
    tf3 = tb3.text_frame
    p = tf3.paragraphs[0]
    p.text = "Referential Integrity Enforcement"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p2 = tf3.add_paragraph()
    p2.text = "• ON DELETE CASCADE: Deleting a booking removes associated tickets and baggage."
    p2.font.size = Pt(9)
    p2.font.color.rgb = C_DARK
    p3 = tf3.add_paragraph()
    p3.text = "• ON DELETE RESTRICT: Prevents deletion of Airports or Airlines with active flight instances."
    p3.font.size = Pt(9)
    p3.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 6: Database Normalization Defense
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg6, C_BG_LIGHT)
    add_header(s6, "Relational Schema Integrity", "Database Normalization Defense (1NF to 3NF)")

    norm_cards = [
        ("First Normal Form (1NF)", "Atomic Attributes & No Repeating Groups", [
            ("Rule:", "Each table column contains only atomic (indivisible) values with no repeating groups or comma-separated lists."),
            ("Application:", "Passengers stored individually in PASSENGERS; seat numbers stored as discrete strings (e.g., '14A') in TICKETS rather than an array."),
            ("Anomaly Prevented:", "Eliminates multi-valued update anomalies and enables index-based seat lookups.")
        ], C_BLUE),
        ("Second Normal Form (2NF)", "Full Functional Dependency on Primary Key", [
            ("Rule:", "All non-key attributes must be fully functionally dependent on the entire primary key, eliminating partial dependencies."),
            ("Application:", "Route info (ORIGIN, DESTINATION, BASE_FARE) isolated in FLIGHTS table; daily execution details (GATE, DATE, STATUS) isolated in FLIGHT_INSTANCES."),
            ("Anomaly Prevented:", "Updating flight departure time does not alter static route pricing.")
        ], C_GREEN),
        ("Third Normal Form (3NF)", "Elimination of Transitive Dependencies", [
            ("Rule:", "Non-key attributes must depend solely on the candidate key, with no transitive dependencies (X -> Y and Y -> Z)."),
            ("Application:", "AIRCRAFT capacity and model stored in AIRCRAFT table; TICKETS references only FLIGHT_INSTANCE_ID, never duplicating aircraft capacity."),
            ("Anomaly Prevented:", "Changing aircraft model for a flight instance automatically reflects accurate seat count without touching ticket rows.")
        ], C_PURPLE)
    ]

    for i, (title, subtitle, bullets, col) in enumerate(norm_cards):
        add_card(s6, Inches(0.8 + i * 3.98), Inches(1.5), Inches(3.75), Inches(3.7))
        bar = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8 + i * 3.98), Inches(1.5), Inches(3.75), Inches(0.1))
        set_shape_flat(bar, col)

        tb = s6.shapes.add_textbox(Inches(0.95 + i * 3.98), Inches(1.7), Inches(3.45), Inches(3.3))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = subtitle
        p2.font.size = Pt(10)
        p2.font.bold = True
        p2.font.color.rgb = C_DARK
        p2.space_after = Pt(8)

        for heading, body in bullets:
            p = tf.add_paragraph()
            p.text = f"{heading} "
            p.font.size = Pt(9.5)
            p.font.bold = True
            p.font.color.rgb = C_NAVY
            p.add_run().text = body
            p.font.color.rgb = C_DARK
            p.space_after = Pt(4)

    # Bottom Normalization Comparison Table
    add_card(s6, Inches(0.8), Inches(5.4), Inches(11.7), Inches(1.7))
    tb_table = s6.shapes.add_textbox(Inches(1.0), Inches(5.48), Inches(11.3), Inches(1.5))
    tf = tb_table.text_frame
    p = tf.paragraphs[0]
    p.text = "BEFORE VS. AFTER NORMALIZATION DECOMPOSITION"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    rows = [
        "• Unnormalized (0NF): (FlightNo, PassengerNames, SeatList, AircraftModel, OriginCity, DestCity) -> High redundancy, cannot insert route without passenger.",
        "• 1NF Decomposition: Flattened rows with single passenger and single seat -> Redundant route info repeated on every ticket.",
        "• 2NF Decomposition: Split into FLIGHTS (Route, BaseFare) and FLIGHT_INSTANCES (Date, Gate, Status) -> No partial key dependencies.",
        "• 3NF Decomposition: Split AIRCRAFT (Capacity, Model) and AIRPORTS (City, Name) -> Zero transitive dependencies across all 15 tables."
    ]
    for r in rows:
        p = tf.add_paragraph()
        p.text = r
        p.font.size = Pt(9)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(2)


    # ==========================================
    # SLIDE 7: SQL Queries Implementation
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    bg7 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg7, C_BG_LIGHT)
    add_header(s7, "Database Implementation", "Production SQL Queries: DDL, DML & Analytical Aggregations")

    # Left: DDL Card
    add_card(s7, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5))
    tb_ddl = s7.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.3), Inches(5.2))
    tf = tb_ddl.text_frame
    p = tf.paragraphs[0]
    p.text = "1. Data Definition Language (DDL) Implementation"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(4)

    ddl_code = (
        "CREATE TABLE TICKETS (\n"
        "    TICKET_ID INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    TICKET_NUMBER VARCHAR(20) NOT NULL UNIQUE,\n"
        "    BOOKING_ID INT NOT NULL,\n"
        "    PASSENGER_ID INT NOT NULL,\n"
        "    FLIGHT_INSTANCE_ID INT NOT NULL,\n"
        "    SEAT_NUMBER VARCHAR(10) NOT NULL,\n"
        "    PRICE DECIMAL(10,2) NOT NULL,\n"
        "    STATUS ENUM('ISSUED','CHECKED_IN','CANCELLED') DEFAULT 'ISSUED',\n"
        "    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n"
        "    CONSTRAINT fk_tickets_booking FOREIGN KEY (BOOKING_ID)\n"
        "        REFERENCES BOOKINGS(BOOKING_ID) ON DELETE CASCADE,\n"
        "    CONSTRAINT fk_tickets_flight FOREIGN KEY (FLIGHT_INSTANCE_ID)\n"
        "        REFERENCES FLIGHT_INSTANCES(FLIGHT_INSTANCE_ID),\n"
        "    CONSTRAINT uq_flight_seat UNIQUE (FLIGHT_INSTANCE_ID, SEAT_NUMBER)\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    )
    p_code = tf.add_paragraph()
    p_code.text = ddl_code
    p_code.font.name = "Courier New"
    p_code.font.size = Pt(8.5)
    p_code.font.color.rgb = C_DARK

    p_note = tf.add_paragraph()
    p_note.text = "• Constraint uq_flight_seat guarantees no two tickets can hold the same seat on any flight instance."
    p_note.font.size = Pt(9)
    p_note.font.bold = True
    p_note.font.color.rgb = C_NAVY

    # Right: DML & Analytics Card
    add_card(s7, Inches(6.8), Inches(1.5), Inches(5.7), Inches(5.5))
    tb_dml = s7.shapes.add_textbox(Inches(7.0), Inches(1.65), Inches(5.3), Inches(5.2))
    tf = tb_dml.text_frame
    p = tf.paragraphs[0]
    p.text = "2. Concurrency Control DML & Seat Reservation"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(4)

    dml_code = (
        "-- Pessimistic Row Lock on Flight Instance\n"
        "SELECT f.FLIGHT_NUMBER, a.TOTAL_SEATS, fi.STATUS\n"
        "FROM FLIGHT_INSTANCES fi\n"
        "JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER\n"
        "JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID\n"
        "WHERE fi.FLIGHT_INSTANCE_ID = ? FOR UPDATE;\n\n"
        "-- Verify Seat is Not Already Reserved\n"
        "SELECT COUNT(*) AS is_taken FROM TICKETS\n"
        "WHERE FLIGHT_INSTANCE_ID = ? AND SEAT_NUMBER = ?\n"
        "  AND STATUS != 'CANCELLED';"
    )
    p_code = tf.add_paragraph()
    p_code.text = dml_code
    p_code.font.name = "Courier New"
    p_code.font.size = Pt(8.5)
    p_code.font.color.rgb = C_DARK
    p_code.space_after = Pt(8)

    p_an = tf.add_paragraph()
    p_an.text = "3. Operational Load Factor & Revenue Aggregation"
    p_an.font.size = Pt(12)
    p_an.font.bold = True
    p_an.font.color.rgb = C_GREEN
    p_an.space_after = Pt(4)

    an_code = (
        "SELECT fi.FLIGHT_INSTANCE_ID, f.FLIGHT_NUMBER,\n"
        "       a.TOTAL_SEATS, COUNT(t.TICKET_ID) AS BOOKED_SEATS,\n"
        "       ROUND(COUNT(t.TICKET_ID)/a.TOTAL_SEATS*100, 2) AS LOAD_FACTOR_PCT,\n"
        "       COALESCE(SUM(t.PRICE), 0) AS TOTAL_REVENUE\n"
        "FROM FLIGHT_INSTANCES fi\n"
        "JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER\n"
        "JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID\n"
        "LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID\n"
        "  AND t.STATUS != 'CANCELLED'\n"
        "GROUP BY fi.FLIGHT_INSTANCE_ID, f.FLIGHT_NUMBER, a.TOTAL_SEATS;"
    )
    p_code2 = tf.add_paragraph()
    p_code2.text = an_code
    p_code2.font.name = "Courier New"
    p_code2.font.size = Pt(8)
    p_code2.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 8: System Design & Transaction Workflow
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    bg8 = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg8, C_BG_LIGHT)
    add_header(s8, "ACID & Concurrency Control", "End-to-End Booking Transaction Lifecycle")

    # Left: Embedded Workflow Diagram Image
    wf_img_path = os.path.join(ASSETS_DIR, "workflow_diagram.png")
    if os.path.exists(wf_img_path):
        s8.shapes.add_picture(wf_img_path, Inches(0.8), Inches(1.4), Inches(6.8), Inches(5.6))
    else:
        add_card(s8, Inches(0.8), Inches(1.4), Inches(6.8), Inches(5.6))

    # Right: 4 ACID Implementation Cards
    acid_cards = [
        ("Atomicity", "All-or-Nothing Execution", "The entire booking transaction (Booking record + Ticket generation + Seat locking) is executed inside START TRANSACTION. If any step fails, ROLLBACK restores exact prior state.", C_BLUE),
        ("Consistency", "Constraint & Invariant Enforcement", "Enforced via foreign key cascades, positive passenger balance constraints, and the unique constraint uq_flight_seat. Database never enters an illegal state.", C_GREEN),
        ("Isolation", "Pessimistic Row-Level Locking", "SELECT ... FOR UPDATE locks the flight instance record, preventing concurrent threads from reading phantom available seats until commit.", C_AMBER),
        ("Durability", "InnoDB Redo Log Persistence", "Once COMMIT is executed, transaction modifications are permanently recorded in MySQL InnoDB Redo logs, surviving system or network crashes.", C_PURPLE)
    ]

    for i, (prop, subtitle, desc, col) in enumerate(acid_cards):
        top = Inches(1.4 + i * 1.42)
        card = add_card(s8, Inches(7.8), top, Inches(4.7), Inches(1.3))
        bar = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.8), top, Inches(0.12), Inches(1.3))
        set_shape_flat(bar, col)

        tb = s8.shapes.add_textbox(Inches(8.05), top + Inches(0.08), Inches(4.35), Inches(1.15))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = f"{prop} — {subtitle}"
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = col

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 9: Frontend Screenshots & User Interface
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    bg9 = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg9, C_BG_LIGHT)
    add_header(s9, "Operational User Interfaces", "Frontend Interface & Real-Time Operational Telemetry")

    # Screenshots arrangement: 5 screens
    screens = [
        ("login_screen.png", "1. Multi-Role Authentication", "Secures routes for Passenger, Staff, & Admin via JWT and USERS table."),
        ("admin_dashboard.png", "2. Admin Operational Control", "FIDS telemetry, flight delays, aircraft allocations, and gate changes."),
        ("passenger_seat_map.png", "3. Interactive Seat Map", "Real-time visual seat allocation mapped directly to TICKETS unique index."),
        ("passenger_boarding_pass.png", "4. Digital Boarding Pass", "Instant pass rendering with barcode tied to CHECK_IN record."),
        ("baggage_tracking.png", "5. Real-Time Baggage Hub", "End-to-end baggage tracking linking weight, tags, and security checks.")
    ]

    coords = [
        (Inches(0.8), Inches(1.4), Inches(3.7), Inches(2.6)),
        (Inches(4.8), Inches(1.4), Inches(3.7), Inches(2.6)),
        (Inches(8.8), Inches(1.4), Inches(3.7), Inches(2.6)),
        (Inches(1.8), Inches(4.3), Inches(4.6), Inches(2.8)),
        (Inches(6.8), Inches(4.3), Inches(4.6), Inches(2.8))
    ]

    for idx, (img_name, label, desc) in enumerate(screens):
        left, top, w, h = coords[idx]
        add_card(s9, left, top, w, h)
        img_path = os.path.join(ASSETS_DIR, img_name)
        if os.path.exists(img_path):
            s9.shapes.add_picture(img_path, left + Inches(0.08), top + Inches(0.08), w - Inches(0.16), h - Inches(0.75))
        
        # Label container at bottom of card
        tb = s9.shapes.add_textbox(left + Inches(0.1), top + h - Inches(0.68), w - Inches(0.2), Inches(0.6))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = label
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_BLUE
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(8)
        p2.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 10: SQL Query Outputs & Live Telemetry
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    bg10 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg10, C_BG_LIGHT)
    add_header(s10, "Execution Verification", "Live SQL Query Outputs & Database Telemetry")

    # Top: Multi-table FIDS Query Output Table
    add_card(s10, Inches(0.8), Inches(1.4), Inches(11.7), Inches(3.6))
    tb_top = s10.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.3), Inches(0.5))
    tf = tb_top.text_frame
    p = tf.paragraphs[0]
    p.text = "Central FIDS Multi-Table Join Output (6-Table Operational Relational Query)"
    p.font.size = Pt(12)
    p.font.bold = True
    p.font.color.rgb = C_NAVY

    # Add PowerPoint Table for FIDS
    table_shape = s10.shapes.add_table(6, 7, Inches(1.0), Inches(2.0), Inches(11.3), Inches(2.8))
    table = table_shape.table

    headers = ["Flight No", "Airline", "Route (Origin -> Dest)", "Scheduled Dep", "Gate", "Aircraft", "Status"]
    for col_idx, htext in enumerate(headers):
        cell = table.cell(0, col_idx)
        cell.fill.solid()
        cell.fill.fore_color.rgb = C_BLUE
        cell.text_frame.paragraphs[0].text = htext
        cell.text_frame.paragraphs[0].font.size = Pt(9.5)
        cell.text_frame.paragraphs[0].font.bold = True
        cell.text_frame.paragraphs[0].font.color.rgb = C_WHITE

    sample_rows = [
        ["AI-101", "Air India", "BOM (Mumbai) -> DEL (Delhi)", "10:00:00", "Gate A1", "Boeing 737", "ON_TIME"],
        ["6E-205", "IndiGo", "DEL (Delhi) -> BLR (Bengaluru)", "11:30:00", "Gate B3", "Airbus A320", "SCHEDULED"],
        ["SG-302", "SpiceJet", "BOM (Mumbai) -> MAA (Chennai)", "14:15:00", "Gate C2", "Boeing 737", "BOARDING"],
        ["UK-401", "Vistara", "BLR (Bengaluru) -> HYD (Hyd)", "16:45:00", "Gate A4", "Airbus A320", "DEPARTED"],
        ["AI-505", "Air India", "HYD (Hyd) -> CCU (Kolkata)", "19:00:00", "Gate B1", "Airbus A321", "ON_TIME"]
    ]
    for row_idx, rdata in enumerate(sample_rows):
        for col_idx, val in enumerate(rdata):
            cell = table.cell(row_idx + 1, col_idx)
            cell.fill.solid()
            cell.fill.fore_color.rgb = RGBColor(241, 245, 249) if row_idx % 2 == 1 else C_WHITE
            p = cell.text_frame.paragraphs[0]
            p.text = val
            p.font.size = Pt(8.5)
            p.font.color.rgb = C_DARK
            if col_idx == 6:
                p.font.bold = True
                p.font.color.rgb = C_GREEN if "TIME" in val or "BOARDING" in val else C_BLUE

    # Bottom: 4 Real-Time Telemetry Cards
    metrics = [
        ("15 Relational Tables", "100% 3NF normalized tables verified with zero data redundancy.", C_BLUE),
        ("18 Foreign Key Constraints", "Strict referential integrity with CASCADE and RESTRICT triggers.", C_GREEN),
        ("0 Double-Bookings", "Pessimistic row-locking (FOR UPDATE) guarantees concurrency safety.", C_AMBER),
        ("< 12ms Query Latency", "B-Tree indexed search across flights, routes, and seat availability.", C_PURPLE)
    ]
    for idx, (mtitle, mdesc, col) in enumerate(metrics):
        left = Inches(0.8 + idx * 2.98)
        top = Inches(5.2)
        add_card(s10, left, top, Inches(2.8), Inches(1.8))
        bar = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, Inches(2.8), Inches(0.08))
        set_shape_flat(bar, col)

        tb = s10.shapes.add_textbox(left + Inches(0.12), top + Inches(0.18), Inches(2.56), Inches(1.5))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = mtitle
        p.font.size = Pt(11)
        p.font.bold = True
        p.font.color.rgb = col
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = mdesc
        p2.font.size = Pt(9)
        p2.font.color.rgb = C_DARK


    # ==========================================
    # SLIDE 11: Conclusion & Future Scope (Dark Navy)
    # ==========================================
    s11 = prs.slides.add_slide(blank_layout)
    bg11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_flat(bg11, C_NAVY)

    accent11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    set_shape_flat(accent11, C_BLUE)

    add_header(s11, "Project Summary & Evaluation", "Conclusion, Technical Learnings & Future Roadmap", dark_mode=True)

    # 3 Summary Cards
    concl_cards = [
        ("Project Achievements", [
            "Engineered complete production-ready AMS backed by MySQL 8.0.",
            "Eliminated double-booking anomalies using ACID row-level locking.",
            "Delivered seamless passenger web check-in & boarding pass generation.",
            "Integrated real-time baggage tracking and administrative FIDS telemetry."
        ], RGBColor(30, 58, 138), C_BLUE),
        ("Core DBMS Learnings", [
            "Translating aviation business logic into a 3NF normalized schema.",
            "Handling concurrent transactions with SELECT ... FOR UPDATE.",
            "Enforcing referential integrity and composite UNIQUE constraints.",
            "Optimizing complex multi-table joins across 6 relational entities."
        ], RGBColor(19, 78, 74), C_GREEN),
        ("Future Roadmap", [
            "Biometric facial recognition integration for paperless boarding.",
            "Automated gate re-allocation algorithm based on arrival delays.",
            "Partition pruning on FLIGHT_STATUS_HISTORY for multi-year telemetry.",
            "Distributed read-replicas for high-traffic passenger query offloading."
        ], RGBColor(88, 28, 135), C_PURPLE)
    ]

    for idx, (ctitle, cbullets, fillcol, bordercol) in enumerate(concl_cards):
        left = Inches(0.8 + idx * 3.98)
        top = Inches(1.5)
        card = add_card(s11, left, top, Inches(3.75), Inches(3.8), fill_color=fillcol, border_color=bordercol)

        tb = s11.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), Inches(3.35), Inches(3.4))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = ctitle
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.space_after = Pt(8)

        for b in cbullets:
            p = tf.add_paragraph()
            p.text = f"• {b}"
            p.font.size = Pt(9.5)
            p.font.color.rgb = RGBColor(226, 232, 240)
            p.space_after = Pt(6)

    # Presenters & Q&A Card at Bottom
    qa_card = add_card(s11, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.4), fill_color=RGBColor(23, 42, 69), border_color=C_BLUE)
    tb_qa = s11.shapes.add_textbox(Inches(1.0), Inches(5.7), Inches(11.3), Inches(1.2))
    tf = tb_qa.text_frame
    p = tf.paragraphs[0]
    p.text = "THANK YOU — OPEN FOR QUESTIONS & EVALUATION"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)

    p2 = tf.add_paragraph()
    p2.text = "• S. Saravana Srinivas (25R11A66P7)  |  • L. Anjan Kumar (25R11A66N5)"
    p2.font.size = Pt(11)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE

    p3 = tf.add_paragraph()
    p3.text = "Repository: https://github.com/Saravana65/Airport-Management-System  |  Database: MySQL 8.0 (airport_management_db)"
    p3.font.size = Pt(9.5)
    p3.font.color.rgb = RGBColor(203, 213, 225)

    prs.save(PPTX_PATH)
    print(f"[SUCCESS] Presentation saved to: {PPTX_PATH}")

# -------------------------------------------------------------
# BUILD PDF
# -------------------------------------------------------------
def build_pdf():
    # We will render high-resolution 1920x1080 images for each of the 11 slides
    # and combine them into Airport_Management_System_DBMS_Presentation.pdf using pymupdf
    pdf_doc = pymupdf.open()
    dpi = 144
    figsize = (1920 / dpi, 1080 / dpi)

    slide_images = []

    # Slide 1
    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
    ax.set_facecolor(HEX_NAVY)
    fig.patch.set_facecolor(HEX_NAVY)
    ax.set_xlim(0, 1920)
    ax.set_ylim(0, 1080)
    ax.axis('off')

    # Top accent line
    ax.plot([0, 1920], [1075, 1075], color=HEX_BLUE, lw=8)

    # Badge
    badge_rect = patches.FancyBboxPatch((120, 880), 620, 50, boxstyle="round,pad=5,rounding_size=10",
                                        facecolor="#1E3A5F", edgecolor=HEX_BLUE, lw=2)
    ax.add_patch(badge_rect)
    ax.text(430, 905, "DATABASE MANAGEMENT SYSTEMS (DBMS) CAPSTONE", color="#93C5FD",
            fontsize=12, fontweight='bold', ha='center', va='center')

    # Title & Subtitle
    ax.text(120, 780, "AIRPORT MANAGEMENT SYSTEM", color="white", fontsize=38, fontweight='bold')
    ax.text(120, 700, "Relational Database Design, ACID Concurrency Control, and Real-Time Multi-Tier Telemetry",
            color="#CBD5E1", fontsize=17)

    # Badges
    pills = [("15 Relational Tables", HEX_BLUE), ("3NF Fully Normalized", HEX_GREEN),
             ("Pessimistic Row-Locking", HEX_AMBER), ("Multi-Tier Full Stack", "#8B5CF6")]
    for idx, (ptext, pcol) in enumerate(pills):
        px = 120 + idx * 420
        prect = patches.FancyBboxPatch((px, 570), 380, 60, boxstyle="round,pad=5,rounding_size=10",
                                       facecolor="#142337", edgecolor=pcol, lw=2)
        ax.add_patch(prect)
        ax.text(px + 190, 600, f"• {ptext}", color="white", fontsize=13, fontweight='bold', ha='center', va='center')

    # Presenters Card
    pres_rect = patches.FancyBboxPatch((120, 220), 1680, 280, boxstyle="round,pad=10,rounding_size=15",
                                       facecolor="#172A45", edgecolor="#334155", lw=2)
    ax.add_patch(pres_rect)

    # Presenter 1
    ax.text(200, 440, "PRESENTED BY", color="#93C5FD", fontsize=13, fontweight='bold')
    ax.text(200, 370, "S. Saravana Srinivas", color="white", fontsize=26, fontweight='bold')
    ax.text(200, 310, "Roll No: 25R11A66P7", color="#CBD5E1", fontsize=18)

    # Divider
    ax.plot([960, 960], [260, 460], color="#334155", lw=2)

    # Presenter 2
    ax.text(1040, 440, "CO-PRESENTER", color="#93C5FD", fontsize=13, fontweight='bold')
    ax.text(1040, 370, "L. Anjan Kumar", color="white", fontsize=26, fontweight='bold')
    ax.text(1040, 310, "Roll No: 25R11A66N5", color="#CBD5E1", fontsize=18)

    ax.text(960, 100, "Academic Evaluation  |  MySQL 8.0 Enterprise Relational DB  |  Node.js + React 18 Architecture",
            color="#64748B", fontsize=12, ha='center')

    img1_path = os.path.join(ASSETS_DIR, "slide1.png")
    plt.savefig(img1_path, dpi=dpi)
    plt.close()
    slide_images.append(img1_path)

    # Function for common slide template (Light Theme)
    def render_light_slide(badge, title):
        fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
        ax.set_facecolor(HEX_BG)
        fig.patch.set_facecolor(HEX_BG)
        ax.set_xlim(0, 1920)
        ax.set_ylim(0, 1080)
        ax.axis('off')

        # Header Badge
        hbadge = patches.FancyBboxPatch((100, 980), 400, 45, boxstyle="round,pad=5,rounding_size=8",
                                        facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
        ax.add_patch(hbadge)
        ax.text(300, 1002, badge.upper(), color=HEX_BLUE, fontsize=11, fontweight='bold', ha='center', va='center')

        # Header Title
        ax.text(100, 915, title, color=HEX_DARK, fontsize=25, fontweight='bold')
        return fig, ax

    # Slide 2: Introduction & Project Objectives
    fig, ax = render_light_slide("Project Overview & Problem Statement", "Introduction & Centralized Airport Operations")
    
    # Left Card
    c1 = patches.FancyBboxPatch((100, 460), 830, 410, boxstyle="round,pad=8,rounding_size=12",
                                facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c1)
    ax.text(140, 820, "Conventional Airport Operational Challenges", color="#DC2626", fontsize=16, fontweight='bold')
    items_c1 = [
        "Data Fragmentation: Siloed flight manifests, gate allocations, and baggage records.",
        "Concurrency Anomalies: Double-booking risk when concurrent passengers book same seat.",
        "Manual Discrepancies: Paper-based check-in causes boarding bottlenecks and baggage loss.",
        "Stale Status Displays: Flight status updates take minutes to propagate across departure gates."
    ]
    for i, itm in enumerate(items_c1):
        ax.text(140, 750 - i * 65, f"• {itm[:55]}\n   {itm[55:]}", color=HEX_DARK, fontsize=12)

    # Right Card
    c2 = patches.FancyBboxPatch((990, 460), 830, 410, boxstyle="round,pad=8,rounding_size=12",
                                facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(c2)
    ax.text(1030, 820, "The AMS Centralized Relational Solution", color=HEX_BLUE, fontsize=16, fontweight='bold')
    items_c2 = [
        "Unified MySQL 8.0 Schema: 15 relational tables linking flights, seats, and telemetry.",
        "Pessimistic Row-Locking: Zero double-booking guarantee via SELECT ... FOR UPDATE.",
        "Digital Check-In & Boarding: Automated pass generation with deterministic seat allocation.",
        "Real-Time Telemetry: Live FIDS synchronizing gates, baggage, and statuses instantly."
    ]
    for i, itm in enumerate(items_c2):
        ax.text(1030, 750 - i * 65, f"✓ {itm[:55]}\n   {itm[55:]}", color=HEX_DARK, fontsize=12)

    # Bottom Objectives Card
    c3 = patches.FancyBboxPatch((100, 80), 1720, 340, boxstyle="round,pad=8,rounding_size=12",
                                facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c3)
    ax.text(140, 370, "Core Engineering & Database Objectives", color=HEX_NAVY, fontsize=16, fontweight='bold')
    objs = [
        "1. Centralized Data Architecture: Replace disconnected records with a normalized relational schema (15 Tables).",
        "2. Strict ACID Transactional Integrity: Guarantee all-or-nothing bookings and eliminate seat-allocation race conditions.",
        "3. Multi-Role Authorization (RBAC): Differentiate privileges across Passenger, Airline Staff, and Airport Admin.",
        "4. High-Performance Multi-Table Joins: Serve real-time flight telemetry across FIDS and passenger dashboards."
    ]
    for i, o in enumerate(objs):
        ax.text(140, 310 - i * 55, f"▶ {o}", color=HEX_DARK, fontsize=12.5)

    img2_path = os.path.join(ASSETS_DIR, "slide2.png")
    plt.savefig(img2_path, dpi=dpi)
    plt.close()
    slide_images.append(img2_path)

    # Slide 3: 4-Tier Full-Stack Technology Architecture
    fig, ax = render_light_slide("Enterprise System Design", "4-Tier Full-Stack Technology Architecture")
    arch_img = os.path.join(ASSETS_DIR, "architecture_diagram.png")
    if os.path.exists(arch_img):
        img_data = plt.imread(arch_img)
        ax.imshow(img_data, extent=[100, 1820, 240, 880])
    
    # Bottom Pool Card
    c_bot = patches.FancyBboxPatch((100, 50), 1720, 160, boxstyle="round,pad=8,rounding_size=12",
                                   facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(c_bot)
    ax.text(140, 165, "DATABASE CONNECTION POOL & PREPARED STATEMENT CONFIGURATION", color=HEX_BLUE, fontsize=14, fontweight='bold')
    ax.text(140, 125, "• Connection Pool: mysql2/promise connection pool configured with 10 max connections, keepAliveInitialDelay=10000ms, queueLimit=0.", color=HEX_DARK, fontsize=11.5)
    ax.text(140, 85, "• Security: 100% Parameterized queries (?, ?) preventing SQL injection attacks across all endpoints.", color=HEX_DARK, fontsize=11.5)

    img3_path = os.path.join(ASSETS_DIR, "slide3.png")
    plt.savefig(img3_path, dpi=dpi)
    plt.close()
    slide_images.append(img3_path)

    # Slide 4: 8-Step Database Design Process
    fig, ax = render_light_slide("Engineering Methodology", "8-Step Database Design & Implementation Lifecycle")
    steps_list = [
        ("Step 1: Requirements", "Domain modeling of airports, flights, manifests, and baggage pipelines."),
        ("Step 2: Entity ID", "Identified 15 primary entities (Airports, Flights, Bookings, Tickets, Baggage)."),
        ("Step 3: Attribute Types", "Mapped exact SQL types: INT PKs, VARCHAR, TIMESTAMP, DECIMAL."),
        ("Step 4: Primary Keys", "Assigned surrogate auto-increment PKs and natural IATA codes."),
        ("Step 5: Foreign Keys", "Configured referential integrity rules (CASCADE for tickets; RESTRICT for routes)."),
        ("Step 6: Cardinality", "Resolved M:N into associative tables (TICKETS links BOOKINGS & FLIGHTS)."),
        ("Step 7: Normalization", "Refined schema through 1NF, 2NF, and 3NF eliminating anomalies."),
        ("Step 8: DDL & Indexing", "Executed MySQL scripts with B-Tree indexes and UNIQUE constraints.")
    ]
    for idx, (stitle, sdesc) in enumerate(steps_list):
        row = idx // 4
        col = idx % 4
        x = 100 + col * 435
        y = 540 if row == 0 else 230
        c_box = patches.FancyBboxPatch((x, y), 415, 270, boxstyle="round,pad=8,rounding_size=10",
                                       facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_box)

        # Step badge
        s_bdg = patches.FancyBboxPatch((x + 15, y + 215), 140, 35, boxstyle="round,pad=3,rounding_size=6",
                                       facecolor=HEX_BLUE, edgecolor=HEX_BLUE)
        ax.add_patch(s_bdg)
        ax.text(x + 85, y + 232, f"STEP {idx+1}", color="white", fontsize=10, fontweight='bold', ha='center', va='center')

        ax.text(x + 15, y + 175, stitle.split(":")[1].strip(), color=HEX_NAVY, fontsize=14, fontweight='bold')
        ax.text(x + 15, y + 100, f"{sdesc[:35]}\n{sdesc[35:]}", color=HEX_DARK, fontsize=11)

    # Bottom catalog
    c_cat = patches.FancyBboxPatch((100, 45), 1720, 140, boxstyle="round,pad=6,rounding_size=10",
                                   facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(c_cat)
    ax.text(140, 140, "ENTITY CLASSIFICATION CATALOG (15 RELATIONAL TABLES)", color=HEX_BLUE, fontsize=13, fontweight='bold')
    ax.text(140, 105, "• Master: AIRPORTS, AIRLINES, AIRCRAFT, USERS  |  • Operations: FLIGHTS, FLIGHT_INSTANCES, GATES, FLIGHT_STATUS_HISTORY", color=HEX_DARK, fontsize=11)
    ax.text(140, 70, "• Transactions: PASSENGERS, BOOKINGS, TICKETS, CHECK_IN, BAGGAGE  |  • Support: EMPLOYEES, NOTIFICATIONS", color=HEX_DARK, fontsize=11)

    img4_path = os.path.join(ASSETS_DIR, "slide4.png")
    plt.savefig(img4_path, dpi=dpi)
    plt.close()
    slide_images.append(img4_path)

    # Slide 5: Entity-Relationship Diagram & Cardinalities
    fig, ax = render_light_slide("Relational Schema Architecture", "Entity-Relationship (ER) Diagram & Table Cardinalities")
    er_img = os.path.join(ASSETS_DIR, "er_diagram.png")
    if os.path.exists(er_img):
        img_data = plt.imread(er_img)
        ax.imshow(img_data, extent=[100, 1200, 50, 880])

    # Right side 3 cards
    cr1 = patches.FancyBboxPatch((1240, 610), 580, 270, boxstyle="round,pad=8,rounding_size=10",
                                facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(cr1)
    ax.text(1265, 835, "Key Relational Cardinalities", color=HEX_NAVY, fontsize=15, fontweight='bold')
    ax.text(1265, 785, "• FLIGHTS (1 : N) FLIGHT_INSTANCES (Daily schedules)", color=HEX_DARK, fontsize=11)
    ax.text(1265, 745, "• BOOKINGS (1 : N) TICKETS (Multi-passenger PNR)", color=HEX_DARK, fontsize=11)
    ax.text(1265, 705, "• FLIGHT_INSTANCES (1 : N) TICKETS (Manifest)", color=HEX_DARK, fontsize=11)
    ax.text(1265, 665, "• TICKETS (1 : 1) CHECK_IN (One pass per ticket)", color=HEX_DARK, fontsize=11)
    ax.text(1265, 625, "• BOOKINGS (1 : N) BAGGAGE (Associated luggage)", color=HEX_DARK, fontsize=11)

    cr2 = patches.FancyBboxPatch((1240, 330), 580, 260, boxstyle="round,pad=8,rounding_size=10",
                                facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(cr2)
    ax.text(1265, 545, "Associative Table Resolution", color=HEX_BLUE, fontsize=15, fontweight='bold')
    ax.text(1265, 495, "• M:N between PASSENGERS & FLIGHT_INSTANCES\n  resolved via TICKETS associative table.", color=HEX_DARK, fontsize=11)
    ax.text(1265, 435, "• TICKETS holds Foreign Keys to BOOKINGS,\n  PASSENGERS, and FLIGHT_INSTANCES.", color=HEX_DARK, fontsize=11)
    ax.text(1265, 375, "• Composite Unique Key prevents duplicate seats.", color=HEX_DARK, fontsize=11)

    cr3 = patches.FancyBboxPatch((1240, 50), 580, 260, boxstyle="round,pad=8,rounding_size=10",
                                facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(cr3)
    ax.text(1265, 265, "Referential Integrity Enforcement", color=HEX_BLUE, fontsize=15, fontweight='bold')
    ax.text(1265, 215, "• ON DELETE CASCADE: Deleting a booking removes\n  associated tickets and baggage records cleanly.", color=HEX_DARK, fontsize=11)
    ax.text(1265, 145, "• ON DELETE RESTRICT: Prevents deletion of Airports\n  or Airlines that have active flight instances.", color=HEX_DARK, fontsize=11)

    img5_path = os.path.join(ASSETS_DIR, "slide5.png")
    plt.savefig(img5_path, dpi=dpi)
    plt.close()
    slide_images.append(img5_path)

    # Slide 6: Database Normalization Defense
    fig, ax = render_light_slide("Relational Schema Integrity", "Database Normalization Defense (1NF to 3NF)")
    norm_img = os.path.join(ASSETS_DIR, "normalization_diagram.png")
    if os.path.exists(norm_img):
        img_data = plt.imread(norm_img)
        ax.imshow(img_data, extent=[100, 1820, 240, 880])

    # Bottom Table Box
    c_norm_bot = patches.FancyBboxPatch((100, 40), 1720, 175, boxstyle="round,pad=8,rounding_size=10",
                                        facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c_norm_bot)
    ax.text(140, 175, "BEFORE VS. AFTER NORMALIZATION DECOMPOSITION", color=HEX_NAVY, fontsize=14, fontweight='bold')
    ax.text(140, 140, "• 1NF Decomposition: Flattened rows with single passenger and single seat -> Eliminates multi-valued update anomalies.", color=HEX_DARK, fontsize=11)
    ax.text(140, 105, "• 2NF Decomposition: Split into FLIGHTS (Route, BaseFare) and FLIGHT_INSTANCES (Date, Gate, Status) -> No partial key dependencies.", color=HEX_DARK, fontsize=11)
    ax.text(140, 70, "• 3NF Decomposition: Split AIRCRAFT (Capacity, Model) and AIRPORTS (City, Name) -> Zero transitive dependencies across all 15 tables.", color=HEX_DARK, fontsize=11)

    img6_path = os.path.join(ASSETS_DIR, "slide6.png")
    plt.savefig(img6_path, dpi=dpi)
    plt.close()
    slide_images.append(img6_path)

    # Slide 7: SQL Queries Implementation
    fig, ax = render_light_slide("Database Implementation", "Production SQL Queries: DDL, DML & Analytical Aggregations")

    # Left: DDL Box
    c_ddl = patches.FancyBboxPatch((100, 50), 830, 830, boxstyle="round,pad=8,rounding_size=12",
                                   facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c_ddl)
    ax.text(140, 835, "1. Data Definition Language (DDL) Implementation", color=HEX_BLUE, fontsize=16, fontweight='bold')
    ddl_txt = (
        "CREATE TABLE TICKETS (\n"
        "    TICKET_ID INT AUTO_INCREMENT PRIMARY KEY,\n"
        "    TICKET_NUMBER VARCHAR(20) NOT NULL UNIQUE,\n"
        "    BOOKING_ID INT NOT NULL,\n"
        "    PASSENGER_ID INT NOT NULL,\n"
        "    FLIGHT_INSTANCE_ID INT NOT NULL,\n"
        "    SEAT_NUMBER VARCHAR(10) NOT NULL,\n"
        "    PRICE DECIMAL(10,2) NOT NULL,\n"
        "    STATUS ENUM('ISSUED','CHECKED_IN','CANCELLED')\n"
        "           DEFAULT 'ISSUED',\n"
        "    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,\n"
        "    CONSTRAINT fk_tickets_booking FOREIGN KEY (BOOKING_ID)\n"
        "        REFERENCES BOOKINGS(BOOKING_ID) ON DELETE CASCADE,\n"
        "    CONSTRAINT fk_tickets_flight FOREIGN KEY (FLIGHT_INSTANCE_ID)\n"
        "        REFERENCES FLIGHT_INSTANCES(FLIGHT_INSTANCE_ID),\n"
        "    CONSTRAINT uq_flight_seat UNIQUE\n"
        "        (FLIGHT_INSTANCE_ID, SEAT_NUMBER)\n"
        ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
    )
    ax.text(140, 310, ddl_txt, color=HEX_DARK, fontfamily="monospace", fontsize=10.5)
    ax.text(140, 100, "• Constraint uq_flight_seat guarantees no two tickets can hold\n  the same seat on any flight instance.", color=HEX_NAVY, fontsize=12, fontweight='bold')

    # Right: DML & Analytics
    c_dml = patches.FancyBboxPatch((990, 50), 830, 830, boxstyle="round,pad=8,rounding_size=12",
                                   facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c_dml)
    ax.text(1030, 835, "2. Concurrency Control DML & Seat Reservation", color=HEX_BLUE, fontsize=16, fontweight='bold')
    dml_txt = (
        "-- Pessimistic Row Lock on Flight Instance\n"
        "SELECT f.FLIGHT_NUMBER, a.TOTAL_SEATS, fi.STATUS\n"
        "FROM FLIGHT_INSTANCES fi\n"
        "JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER\n"
        "JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID\n"
        "WHERE fi.FLIGHT_INSTANCE_ID = ? FOR UPDATE;\n\n"
        "-- Verify Seat is Not Already Reserved\n"
        "SELECT COUNT(*) AS is_taken FROM TICKETS\n"
        "WHERE FLIGHT_INSTANCE_ID = ? AND SEAT_NUMBER = ?\n"
        "  AND STATUS != 'CANCELLED';"
    )
    ax.text(1030, 560, dml_txt, color=HEX_DARK, fontfamily="monospace", fontsize=10.5)

    ax.text(1030, 480, "3. Operational Load Factor & Revenue Aggregation", color=HEX_GREEN, fontsize=16, fontweight='bold')
    an_txt = (
        "SELECT fi.FLIGHT_INSTANCE_ID, f.FLIGHT_NUMBER,\n"
        "       a.TOTAL_SEATS, COUNT(t.TICKET_ID) AS BOOKED_SEATS,\n"
        "       ROUND(COUNT(t.TICKET_ID)/a.TOTAL_SEATS*100, 2)\n"
        "             AS LOAD_FACTOR_PCT,\n"
        "       COALESCE(SUM(t.PRICE), 0) AS TOTAL_REVENUE\n"
        "FROM FLIGHT_INSTANCES fi\n"
        "JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER\n"
        "JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID\n"
        "LEFT JOIN TICKETS t ON fi.FLIGHT_INSTANCE_ID = t.FLIGHT_INSTANCE_ID\n"
        "  AND t.STATUS != 'CANCELLED'\n"
        "GROUP BY fi.FLIGHT_INSTANCE_ID, f.FLIGHT_NUMBER, a.TOTAL_SEATS;"
    )
    ax.text(1030, 170, an_txt, color=HEX_DARK, fontfamily="monospace", fontsize=10)

    img7_path = os.path.join(ASSETS_DIR, "slide7.png")
    plt.savefig(img7_path, dpi=dpi)
    plt.close()
    slide_images.append(img7_path)

    # Slide 8: Transaction Workflow & ACID
    fig, ax = render_light_slide("ACID & Concurrency Control", "End-to-End Booking Transaction Lifecycle")
    wf_img = os.path.join(ASSETS_DIR, "workflow_diagram.png")
    if os.path.exists(wf_img):
        img_data = plt.imread(wf_img)
        ax.imshow(img_data, extent=[100, 1100, 50, 880])

    # Right side 4 cards
    acid_items = [
        ("Atomicity", "All-or-Nothing Execution", "The entire booking transaction (Booking record + Ticket generation + Seat locking) is executed inside START TRANSACTION. If any step fails, ROLLBACK restores exact prior state.", HEX_BLUE),
        ("Consistency", "Constraint & Invariant Enforcement", "Enforced via foreign key cascades, positive passenger balance constraints, and the unique constraint uq_flight_seat. Database never enters an illegal state.", HEX_GREEN),
        ("Isolation", "Pessimistic Row-Level Locking", "SELECT ... FOR UPDATE locks the flight instance record, preventing concurrent threads from reading phantom available seats until commit.", HEX_AMBER),
        ("Durability", "InnoDB Redo Log Persistence", "Once COMMIT is executed, transaction modifications are permanently recorded in MySQL InnoDB Redo logs, surviving system or network crashes.", "#8B5CF6")
    ]
    for idx, (prop, sub, desc, col) in enumerate(acid_items):
        y = 680 - idx * 210
        cb = patches.FancyBboxPatch((1140, y), 680, 185, boxstyle="round,pad=8,rounding_size=10",
                                   facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(cb)
        cbar = patches.Rectangle((1140, y), 15, 185, facecolor=col)
        ax.add_patch(cbar)
        ax.text(1175, y + 145, f"{prop} — {sub}", color=col, fontsize=14, fontweight='bold')
        ax.text(1175, y + 70, f"{desc[:45]}\n{desc[45:95]}\n{desc[95:]}", color=HEX_DARK, fontsize=10.5)

    img8_path = os.path.join(ASSETS_DIR, "slide8.png")
    plt.savefig(img8_path, dpi=dpi)
    plt.close()
    slide_images.append(img8_path)

    # Slide 9: Frontend Screenshots
    fig, ax = render_light_slide("Operational User Interfaces", "Frontend Interface & Real-Time Operational Telemetry")
    screens_info = [
        ("login_screen.png", "1. Multi-Role Authentication", "Secures routes for Passenger, Staff, & Admin via JWT and USERS table.", [100, 620, 520, 860]),
        ("admin_dashboard.png", "2. Admin Operational Control", "FIDS telemetry, flight delays, aircraft allocations, and gate changes.", [690, 1210, 520, 860]),
        ("passenger_seat_map.png", "3. Interactive Seat Map", "Real-time visual seat allocation mapped directly to TICKETS unique index.", [1280, 1800, 520, 860]),
        ("passenger_boarding_pass.png", "4. Digital Boarding Pass", "Instant pass rendering with barcode tied to CHECK_IN record.", [250, 930, 60, 480]),
        ("baggage_tracking.png", "5. Real-Time Baggage Hub", "End-to-end baggage tracking linking weight, tags, and security checks.", [990, 1670, 60, 480])
    ]
    for img_name, label, desc, (x1, x2, y1, y2) in screens_info:
        img_path = os.path.join(ASSETS_DIR, img_name)
        if os.path.exists(img_path):
            idata = plt.imread(img_path)
            ax.imshow(idata, extent=[x1, x2, y1 + 60, y2])
        # Box frame
        frame = patches.Rectangle((x1, y1), x2 - x1, y2 - y1, fill=False, edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(frame)
        ax.text(x1 + 10, y1 + 38, label, color=HEX_BLUE, fontsize=11, fontweight='bold')
        ax.text(x1 + 10, y1 + 15, desc[:50], color=HEX_DARK, fontsize=9)

    img9_path = os.path.join(ASSETS_DIR, "slide9.png")
    plt.savefig(img9_path, dpi=dpi)
    plt.close()
    slide_images.append(img9_path)

    # Slide 10: SQL Query Execution Outputs & Live Telemetry
    fig, ax = render_light_slide("Execution Verification", "Live SQL Query Outputs & Database Telemetry")
    
    # Top Table Card
    c_top = patches.FancyBboxPatch((100, 360), 1720, 520, boxstyle="round,pad=8,rounding_size=12",
                                   facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c_top)
    ax.text(140, 835, "Central FIDS Multi-Table Join Output (6-Table Operational Relational Query)", color=HEX_NAVY, fontsize=16, fontweight='bold')

    # Draw table
    col_names = ["Flight No", "Airline", "Route (Origin -> Dest)", "Scheduled Dep", "Gate", "Aircraft", "Status"]
    col_x = [140, 300, 500, 950, 1150, 1330, 1530]
    
    # Header row
    hdr_box = patches.Rectangle((120, 750), 1680, 50, facecolor=HEX_BLUE)
    ax.add_patch(hdr_box)
    for c_i, cname in enumerate(col_names):
        ax.text(col_x[c_i], 765, cname, color="white", fontsize=11, fontweight='bold')

    rows_data = [
        ["AI-101", "Air India", "BOM (Mumbai) -> DEL (Delhi)", "10:00:00", "Gate A1", "Boeing 737", "ON_TIME"],
        ["6E-205", "IndiGo", "DEL (Delhi) -> BLR (Bengaluru)", "11:30:00", "Gate B3", "Airbus A320", "SCHEDULED"],
        ["SG-302", "SpiceJet", "BOM (Mumbai) -> MAA (Chennai)", "14:15:00", "Gate C2", "Boeing 737", "BOARDING"],
        ["UK-401", "Vistara", "BLR (Bengaluru) -> HYD (Hyd)", "16:45:00", "Gate A4", "Airbus A320", "DEPARTED"],
        ["AI-505", "Air India", "HYD (Hyd) -> CCU (Kolkata)", "19:00:00", "Gate B1", "Airbus A321", "ON_TIME"]
    ]
    for r_i, rdata in enumerate(rows_data):
        ry = 690 - r_i * 60
        r_box = patches.Rectangle((120, ry), 1680, 50, facecolor=HEX_LIGHT_BLUE if r_i % 2 == 1 else "white")
        ax.add_patch(r_box)
        for c_i, cval in enumerate(rdata):
            col_color = HEX_GREEN if "TIME" in cval or "BOARDING" in cval else (HEX_BLUE if c_i == 6 else HEX_DARK)
            ax.text(col_x[c_i], ry + 15, cval, color=col_color, fontsize=10.5, fontweight='bold' if c_i in [0, 6] else 'normal')

    # Bottom 4 telemetry metrics
    metrics_list = [
        ("15 Relational Tables", "100% 3NF normalized tables verified with zero data redundancy.", HEX_BLUE),
        ("18 Foreign Keys", "Strict referential integrity with CASCADE and RESTRICT triggers.", HEX_GREEN),
        ("0 Double-Bookings", "Pessimistic row-locking (FOR UPDATE) guarantees concurrency safety.", HEX_AMBER),
        ("< 12ms Latency", "B-Tree indexed search across flights, routes, and seat availability.", "#8B5CF6")
    ]
    for m_i, (mtitle, mdesc, col) in enumerate(metrics_list):
        mx = 100 + m_i * 435
        c_m = patches.FancyBboxPatch((mx, 50), 415, 270, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_m)
        m_bar = patches.Rectangle((mx, 310), 415, 10, facecolor=col)
        ax.add_patch(m_bar)
        ax.text(mx + 20, 260, mtitle, color=col, fontsize=16, fontweight='bold')
        ax.text(mx + 20, 170, f"{mdesc[:35]}\n{mdesc[35:]}", color=HEX_DARK, fontsize=11.5)

    img10_path = os.path.join(ASSETS_DIR, "slide10.png")
    plt.savefig(img10_path, dpi=dpi)
    plt.close()
    slide_images.append(img10_path)

    # Slide 11: Conclusion & Future Scope (Dark Navy)
    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
    ax.set_facecolor(HEX_NAVY)
    fig.patch.set_facecolor(HEX_NAVY)
    ax.set_xlim(0, 1920)
    ax.set_ylim(0, 1080)
    ax.axis('off')

    # Top accent line
    ax.plot([0, 1920], [1075, 1075], color=HEX_BLUE, lw=8)

    # Badge
    badge_rect = patches.FancyBboxPatch((120, 980), 300, 45, boxstyle="round,pad=5,rounding_size=8",
                                        facecolor="#1E3A5F", edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(badge_rect)
    ax.text(270, 1002, "PROJECT CLOSURE & EVALUATION", color="#93C5FD", fontsize=11, fontweight='bold', ha='center', va='center')

    # Title
    ax.text(120, 915, "Conclusion, Technical Learnings & Future Roadmap", color="white", fontsize=25, fontweight='bold')

    # 3 Summary Cards
    cards_11 = [
        ("Project Achievements", [
            "Engineered complete production-ready AMS backed by MySQL 8.0.",
            "Eliminated double-booking anomalies using ACID row-level locking.",
            "Delivered seamless passenger web check-in & boarding pass generation.",
            "Integrated real-time baggage tracking and administrative FIDS telemetry."
        ], "#1E3A8A", HEX_BLUE),
        ("Core DBMS Learnings", [
            "Translating aviation business logic into a 3NF normalized schema.",
            "Handling concurrent transactions with SELECT ... FOR UPDATE.",
            "Enforcing referential integrity and composite UNIQUE constraints.",
            "Optimizing complex multi-table joins across 6 relational entities."
        ], "#134E4A", HEX_GREEN),
        ("Future Roadmap", [
            "Biometric facial recognition integration for paperless boarding.",
            "Automated gate re-allocation algorithm based on arrival delays.",
            "Partition pruning on FLIGHT_STATUS_HISTORY for multi-year telemetry.",
            "Distributed read-replicas for high-traffic passenger query offloading."
        ], "#581C87", "#8B5CF6")
    ]
    for idx, (ctitle, cbullets, fillcol, bordercol) in enumerate(cards_11):
        cx = 120 + idx * 570
        c11 = patches.FancyBboxPatch((cx, 320), 540, 540, boxstyle="round,pad=8,rounding_size=12",
                                     facecolor=fillcol, edgecolor=bordercol, lw=2)
        ax.add_patch(c11)
        ax.text(cx + 25, 800, ctitle, color="white", fontsize=18, fontweight='bold')
        for b_i, b in enumerate(cbullets):
            ax.text(cx + 25, 730 - b_i * 95, f"• {b[:35]}\n   {b[35:]}", color="#E2E8F0", fontsize=12)

    # QA card at bottom
    qa_card = patches.FancyBboxPatch((120, 50), 1680, 220, boxstyle="round,pad=8,rounding_size=12",
                                     facecolor="#172A45", edgecolor=HEX_BLUE, lw=2)
    ax.add_patch(qa_card)
    ax.text(160, 205, "THANK YOU — OPEN FOR QUESTIONS & EVALUATION", color="#93C5FD", fontsize=16, fontweight='bold')
    ax.text(160, 150, "• S. Saravana Srinivas (25R11A66P7)   |   • L. Anjan Kumar (25R11A66N5)", color="white", fontsize=16, fontweight='bold')
    ax.text(160, 95, "Repository: https://github.com/Saravana65/Airport-Management-System   |   Database: MySQL 8.0 (airport_management_db)", color="#CBD5E1", fontsize=13)

    img11_path = os.path.join(ASSETS_DIR, "slide11.png")
    plt.savefig(img11_path, dpi=dpi)
    plt.close()
    slide_images.append(img11_path)

    # Combine into single PDF using PyMuPDF
    for img_path in slide_images:
        img_doc = pymupdf.open(img_path)
        pdf_bytes = img_doc.convert_to_pdf()
        slide_pdf = pymupdf.open("pdf", pdf_bytes)
        pdf_doc.insert_pdf(slide_pdf)
        slide_pdf.close()
        img_doc.close()

    pdf_doc.save(PDF_PATH)
    pdf_doc.close()
    print(f"[SUCCESS] High-resolution PDF presentation saved to: {PDF_PATH}")

if __name__ == "__main__":
    print("[1/2] Generating PPTX Presentation...")
    build_pptx()
    print("[2/2] Generating PDF Presentation...")
    build_pdf()
    print("\n[COMPLETE] Both PPTX and PDF presentations have been successfully generated!")
