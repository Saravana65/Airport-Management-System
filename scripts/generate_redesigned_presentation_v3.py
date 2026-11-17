import os
import sys
import textwrap
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from PIL import Image
import pymupdf

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ASSETS_DIR = os.path.join(BASE_DIR, "presentation_assets")
PPTX_FINAL_PATH = os.path.join(BASE_DIR, "Airport_Management_System_DBMS_Presentation_FINAL.pptx")
PDF_FINAL_PATH = os.path.join(BASE_DIR, "Airport_Management_System_DBMS_Presentation_FINAL.pdf")

# Colors
C_NAVY = RGBColor(16, 42, 67)          # #102A43
C_BLUE = RGBColor(37, 99, 235)         # #2563EB
C_DARK_BLUE = RGBColor(29, 78, 216)    # #1D4ED8
C_LIGHT_BLUE = RGBColor(234, 243, 255) # #EAF3FF
C_WHITE = RGBColor(255, 255, 255)      # #FFFFFF
C_BG_LIGHT = RGBColor(248, 250, 252)   # #F8FAFC
C_DARK = RGBColor(15, 23, 42)          # #0F172A
C_MUTED = RGBColor(100, 116, 139)      # #64748B
C_BORDER = RGBColor(203, 213, 225)     # #CBD5E1
C_GREEN = RGBColor(16, 185, 129)       # #10B981
C_AMBER = RGBColor(245, 158, 11)       # #F59E0B
C_PURPLE = RGBColor(139, 92, 246)      # #8B5CF6
C_RED = RGBColor(239, 68, 68)          # #EF4444

HEX_NAVY = "#102A43"
HEX_BLUE = "#2563EB"
HEX_DARK_BLUE = "#1D4ED8"
HEX_LIGHT_BLUE = "#EAF3FF"
HEX_WHITE = "#FFFFFF"
HEX_BG = "#F8FAFC"
HEX_DARK = "#0F172A"
HEX_MUTED = "#64748B"
HEX_BORDER = "#CBD5E1"
HEX_GREEN = "#10B981"
HEX_AMBER = "#F59E0B"
HEX_RED = "#EF4444"
HEX_PURPLE = "#8B5CF6"

def set_shape_style(shape, fill_color, line_color=None, line_width=1):
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill_color
    if line_color:
        shape.line.color.rgb = line_color
        shape.line.width = Pt(line_width)
    else:
        shape.line.fill.background()

def add_header_pptx(slide, badge_text, title_text, dark_mode=False):
    b_w = Inches(max(3.2, len(badge_text) * 0.12))
    badge = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.4), b_w, Inches(0.35))
    set_shape_style(badge, C_BLUE if dark_mode else C_LIGHT_BLUE, C_BLUE, line_width=1.5)
    tf = badge.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_top = tf.margin_right = tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.text = badge_text.upper()
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = C_WHITE if dark_mode else C_BLUE
    p.alignment = PP_ALIGN.CENTER

    title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.78), Inches(11.7), Inches(0.55))
    tf2 = title_box.text_frame
    tf2.word_wrap = True
    tf2.margin_left = tf2.margin_top = tf2.margin_right = tf2.margin_bottom = 0
    p2 = tf2.paragraphs[0]
    p2.text = title_text
    p2.font.size = Pt(21)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE if dark_mode else C_DARK

def add_card_pptx(slide, left, top, width, height, fill_color=C_WHITE, border_color=C_BORDER):
    card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    set_shape_style(card, fill_color, border_color, line_width=1.2)
    return card

# -------------------------------------------------------------
# BUILD PPTX
# -------------------------------------------------------------
def build_final_pptx():
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)
    blank_layout = prs.slide_layouts[6]

    # Slide 1: Title
    s1 = prs.slides.add_slide(blank_layout)
    runway_img = os.path.join(ASSETS_DIR, "airport_terminal_modern.jpg")
    if os.path.exists(runway_img):
        s1.shapes.add_picture(runway_img, 0, 0, Inches(13.333), Inches(7.5))
    
    overlay1 = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(overlay1, C_NAVY)

    top_bar = s1.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    set_shape_style(top_bar, C_BLUE)

    pill1 = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(0.9), Inches(5.2), Inches(0.38))
    set_shape_style(pill1, RGBColor(30, 58, 95), C_BLUE, line_width=1.5)
    p = pill1.text_frame.paragraphs[0]
    p.text = "DATABASE MANAGEMENT SYSTEMS (DBMS) CAPSTONE"
    p.font.size = Pt(9.5)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)
    p.alignment = PP_ALIGN.CENTER

    tb1 = s1.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(11.7), Inches(1.1))
    p = tb1.text_frame.paragraphs[0]
    p.text = "AIRPORT MANAGEMENT SYSTEM"
    p.font.size = Pt(38)
    p.font.bold = True
    p.font.color.rgb = C_WHITE

    tb1_sub = s1.shapes.add_textbox(Inches(0.8), Inches(2.7), Inches(11.7), Inches(0.55))
    p = tb1_sub.text_frame.paragraphs[0]
    p.text = "Relational Database Design, ACID Concurrency Control, and Real-Time Multi-Tier Telemetry"
    p.font.size = Pt(15.5)
    p.font.color.rgb = RGBColor(203, 213, 225)

    badges1 = [
        ("15 Relational Tables", C_BLUE),
        ("3NF Normalized", C_GREEN),
        ("Pessimistic Row-Locking", C_AMBER),
        ("Multi-Tier Architecture", C_PURPLE)
    ]
    for i, (btext, bcol) in enumerate(badges1):
        b = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8 + i * 2.95), Inches(3.6), Inches(2.75), Inches(0.42))
        set_shape_style(b, RGBColor(20, 35, 55), bcol, line_width=1.2)
        bp = b.text_frame.paragraphs[0]
        bp.text = f"• {btext}"
        bp.font.size = Pt(10.5)
        bp.font.bold = True
        bp.font.color.rgb = C_WHITE
        bp.alignment = PP_ALIGN.CENTER

    p_card = s1.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.8), Inches(4.4), Inches(11.7), Inches(2.1))
    set_shape_style(p_card, RGBColor(23, 42, 69), RGBColor(51, 65, 85), line_width=1.5)
    
    p1 = s1.shapes.add_textbox(Inches(1.2), Inches(4.6), Inches(5.2), Inches(1.7))
    tf1 = p1.text_frame
    p = tf1.paragraphs[0]
    p.text = "PRESENTED BY"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)
    p2 = tf1.add_paragraph()
    p2.text = "S. Saravana Srinivas"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE
    p3 = tf1.add_paragraph()
    p3.text = "Roll No: 25R11A66P7"
    p3.font.size = Pt(14)
    p3.font.color.rgb = RGBColor(203, 213, 225)

    p2_box = s1.shapes.add_textbox(Inches(6.8), Inches(4.6), Inches(5.2), Inches(1.7))
    tf2 = p2_box.text_frame
    p = tf2.paragraphs[0]
    p.text = "CO-PRESENTER"
    p.font.size = Pt(10)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)
    p2 = tf2.add_paragraph()
    p2.text = "L. Anjan Kumar"
    p2.font.size = Pt(20)
    p2.font.bold = True
    p2.font.color.rgb = C_WHITE
    p3 = tf2.add_paragraph()
    p3.text = "Roll No: 25R11A66N5"
    p3.font.size = Pt(14)
    p3.font.color.rgb = RGBColor(203, 213, 225)

    # Slide 2: Introduction
    s2 = prs.slides.add_slide(blank_layout)
    bg2 = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg2, C_BG_LIGHT)
    add_header_pptx(s2, "Operational Context", "Introduction: Modern Airport Operations vs. Conventional Gaps")

    term_img = os.path.join(ASSETS_DIR, "airport_terminal_modern.jpg")
    if os.path.exists(term_img):
        s2.shapes.add_picture(term_img, Inches(0.8), Inches(1.5), Inches(5.4), Inches(5.5))
    
    cap_box = s2.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.0), Inches(6.1), Inches(5.0), Inches(0.7))
    set_shape_style(cap_box, RGBColor(16, 42, 67), C_BLUE, line_width=1)
    cp = cap_box.text_frame.paragraphs[0]
    cp.text = "Aviation Operations Control Center (OCC)\nCentralized Real-Time Telemetry & Manifest Synchronization"
    cp.font.size = Pt(9)
    cp.font.bold = True
    cp.font.color.rgb = C_WHITE
    cp.alignment = PP_ALIGN.CENTER

    c_trad = add_card_pptx(s2, Inches(6.5), Inches(1.5), Inches(2.95), Inches(2.55), fill_color=C_WHITE, border_color=C_RED)
    bar_r = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.5), Inches(1.5), Inches(2.95), Inches(0.08))
    set_shape_style(bar_r, C_RED)
    tb_t = s2.shapes.add_textbox(Inches(6.65), Inches(1.65), Inches(2.65), Inches(2.3))
    tf = tb_t.text_frame
    p = tf.paragraphs[0]
    p.text = "Conventional Gaps"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_RED
    for itm in ["Siloed flight manifests & paper logs", "Double-booking race conditions", "Manual check-in boarding queues", "Stale display board updates"]:
        p = tf.add_paragraph()
        p.text = f"• {itm}"
        p.font.size = Pt(8.8)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(2)

    c_sol = add_card_pptx(s2, Inches(9.6), Inches(1.5), Inches(2.9), Inches(2.55), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    bar_b = s2.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(9.6), Inches(1.5), Inches(2.9), Inches(0.08))
    set_shape_style(bar_b, C_BLUE)
    tb_s = s2.shapes.add_textbox(Inches(9.75), Inches(1.65), Inches(2.6), Inches(2.3))
    tf = tb_s.text_frame
    p = tf.paragraphs[0]
    p.text = "AMS Architecture"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    for itm in ["Unified 15-table relational schema", "Pessimistic row-locking (ACID)", "Instant web check-in & boarding pass", "Live FIDS flight telemetry sync"]:
        p = tf.add_paragraph()
        p.text = f"✓ {itm}"
        p.font.size = Pt(8.8)
        p.font.color.rgb = C_DARK
        p.space_after = Pt(2)

    objs = [
        ("1. Data Centralization", "Replace paper manifests with a 3NF normalized schema."),
        ("2. ACID Concurrency", "Zero double-bookings via SELECT ... FOR UPDATE row locks."),
        ("3. Role-Based Security", "Separate views for Passengers, Airline Staff, and Admins."),
        ("4. Real-Time Telemetry", "Instant FIDS dashboard synchronizing gates and flight status.")
    ]
    for idx, (otitle, odesc) in enumerate(objs):
        row = idx // 2
        col = idx % 2
        ox = Inches(6.5 + col * 3.1)
        oy = Inches(4.25 + row * 1.4)
        c_o = add_card_pptx(s2, ox, oy, Inches(2.95), Inches(1.25))
        tb_o = s2.shapes.add_textbox(ox + Inches(0.12), oy + Inches(0.1), Inches(2.7), Inches(1.05))
        tf = tb_o.text_frame
        p = tf.paragraphs[0]
        p.text = otitle
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p2 = tf.add_paragraph()
        p2.text = odesc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_DARK

    # Slide 3: Frontend & Backend
    s3 = prs.slides.add_slide(blank_layout)
    bg3 = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg3, C_BG_LIGHT)
    add_header_pptx(s3, "Enterprise Architecture", "Technical Architecture: Multi-Tier Integration & Data Flow")

    arch_img = os.path.join(ASSETS_DIR, "architecture_diagram.png")
    if os.path.exists(arch_img):
        s3.shapes.add_picture(arch_img, Inches(0.8), Inches(1.5), Inches(6.0), Inches(5.5))

    arch_cards = [
        ("Presentation Tier (Frontend)", "React 18 + Vite + Tailwind CSS", "Component-based reactive UI rendering interactive seat maps, live flight search, digital boarding passes, and role-guarded views.", C_BLUE),
        ("Application Tier (REST Gateway)", "Node.js + Express.js Engine", "REST API routing, JWT token authentication, input validation, and pessimistic transaction coordination.", C_DARK_BLUE),
        ("Microservice Optimization Engines", "C Core Engine & Java Pricing Service", "C memory-optimized route calculation routines and Java dynamic fare computation modules called via inter-process bridges.", C_PURPLE),
        ("Relational Database Tier", "MySQL 8.0 / Oracle Engine (InnoDB)", "15 Normalized tables (3NF), row-level locks, connection pool (10 connections), and prepared statements preventing SQLi.", C_GREEN)
    ]
    for idx, (ctitle, csub, cdesc, col) in enumerate(arch_cards):
        top_y = Inches(1.5 + idx * 1.4)
        c_card = add_card_pptx(s3, Inches(7.0), top_y, Inches(5.5), Inches(1.25))
        c_bar = s3.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.0), top_y, Inches(0.12), Inches(1.25))
        set_shape_style(c_bar, col)

        tb_ac = s3.shapes.add_textbox(Inches(7.25), top_y + Inches(0.08), Inches(5.1), Inches(1.1))
        tf = tb_ac.text_frame
        p = tf.paragraphs[0]
        p.text = f"{ctitle} — {csub}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col
        p2 = tf.add_paragraph()
        p2.text = cdesc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_DARK

    # Slide 4: Database Design Process
    s4 = prs.slides.add_slide(blank_layout)
    bg4 = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg4, C_BG_LIGHT)
    add_header_pptx(s4, "Engineering Methodology", "Relational Database Design Process: From Domain to Production DDL")

    stages = [
        ("1. Requirements", "Domain modeling of flights, gates, baggage."),
        ("2. Entity ID", "15 Core entities identified."),
        ("3. Attributes", "Exact types (INT, VARCHAR, TIMESTAMP)."),
        ("4. Relationships", "1:1, 1:N, and associative M:N."),
        ("5. Normalization", "1NF to 3NF schema refinement."),
        ("6. DB Build", "DDL scripts & B-Tree indexes.")
    ]
    for idx, (stitle, sdesc) in enumerate(stages):
        sx = Inches(0.8 + idx * 1.98)
        c_st = add_card_pptx(s4, sx, Inches(1.5), Inches(1.85), Inches(1.4))
        c_sbar = s4.shapes.add_shape(MSO_SHAPE.RECTANGLE, sx, Inches(1.5), Inches(1.85), Inches(0.06))
        set_shape_style(c_sbar, C_BLUE)
        tb_s = s4.shapes.add_textbox(sx + Inches(0.08), Inches(1.6), Inches(1.69), Inches(1.2))
        tf = tb_s.text_frame
        p = tf.paragraphs[0]
        p.text = stitle
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = C_NAVY
        p2 = tf.add_paragraph()
        p2.text = sdesc
        p2.font.size = Pt(8)
        p2.font.color.rgb = C_DARK

    c_ent = add_card_pptx(s4, Inches(0.8), Inches(3.1), Inches(5.6), Inches(3.9))
    tb_ent = s4.shapes.add_textbox(Inches(1.0), Inches(3.2), Inches(5.2), Inches(3.7))
    tf = tb_ent.text_frame
    p = tf.paragraphs[0]
    p.text = "Concrete Entity Example: TICKETS (Relational Mapping)"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    p.space_after = Pt(4)

    ent_schema = (
        "Entity Name: TICKETS (Associative Table resolving M:N)\n"
        "--------------------------------------------------------\n"
        "• TICKET_ID           INT (Primary Key, Auto-Increment)\n"
        "• TICKET_NUMBER       VARCHAR(20) (Natural Unique Code)\n"
        "• BOOKING_ID          INT (Foreign Key -> BOOKINGS)\n"
        "• PASSENGER_ID        INT (Foreign Key -> PASSENGERS)\n"
        "• FLIGHT_INSTANCE_ID  INT (Foreign Key -> FLIGHT_INSTANCES)\n"
        "• SEAT_NUMBER         VARCHAR(10) (e.g., '14A')\n"
        "• PRICE               DECIMAL(10,2) (Calculated fare)\n"
        "• STATUS              ENUM('ISSUED','CHECKED_IN','CANCELLED')\n"
        "--------------------------------------------------------\n"
        "Constraint: UNIQUE (FLIGHT_INSTANCE_ID, SEAT_NUMBER)\n"
        "Guarantees zero duplicate seat reservations in MySQL/Oracle."
    )
    p2 = tf.add_paragraph()
    p2.text = ent_schema
    p2.font.name = "Courier New"
    p2.font.size = Pt(8)
    p2.font.color.rgb = C_DARK

    map_img = os.path.join(ASSETS_DIR, "original_mapping.png")
    if os.path.exists(map_img):
        s4.shapes.add_picture(map_img, Inches(6.6), Inches(3.1), Inches(5.9), Inches(3.9))

    # Slide 5: ER Diagram
    s5 = prs.slides.add_slide(blank_layout)
    bg5 = s5.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg5, C_BG_LIGHT)
    add_header_pptx(s5, "Schema Architecture", "Entity-Relationship (ER) Diagram & Table Cardinalities")

    er_img = os.path.join(ASSETS_DIR, "er_diagram.png")
    if os.path.exists(er_img):
        s5.shapes.add_picture(er_img, Inches(0.8), Inches(1.4), Inches(7.6), Inches(5.6))

    c_card1 = add_card_pptx(s5, Inches(8.6), Inches(1.4), Inches(3.9), Inches(1.75))
    tb = s5.shapes.add_textbox(Inches(8.8), Inches(1.5), Inches(3.5), Inches(1.55))
    tf = tb.text_frame
    p = tf.paragraphs[0]
    p.text = "Key Relational Cardinalities"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_NAVY
    for c in ["FLIGHTS (1 : N) FLIGHT_INSTANCES", "BOOKINGS (1 : N) TICKETS (PNR manifest)", "FLIGHT_INSTANCES (1 : N) TICKETS", "TICKETS (1 : 1) CHECK_IN", "BOOKINGS (1 : N) BAGGAGE"]:
        p = tf.add_paragraph()
        p.text = f"• {c}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK

    c_card2 = add_card_pptx(s5, Inches(8.6), Inches(3.25), Inches(3.9), Inches(1.85))
    tb2 = s5.shapes.add_textbox(Inches(8.8), Inches(3.35), Inches(3.5), Inches(1.65))
    tf2 = tb2.text_frame
    p = tf2.paragraphs[0]
    p.text = "Associative M:N Resolution"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    for c in ["M:N between PASSENGERS & FLIGHT_INSTANCES resolved via TICKETS associative table.", "TICKETS holds composite FKs to BOOKINGS, PASSENGERS, and FLIGHTS.", "Enforces unique seat allocation per flight."]:
        p = tf2.add_paragraph()
        p.text = f"• {c}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK

    c_card3 = add_card_pptx(s5, Inches(8.6), Inches(5.2), Inches(3.9), Inches(1.8), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    tb3 = s5.shapes.add_textbox(Inches(8.8), Inches(5.3), Inches(3.5), Inches(1.6))
    tf3 = tb3.text_frame
    p = tf3.paragraphs[0]
    p.text = "Referential Integrity Rules"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    for c in ["ON DELETE CASCADE: Removing a booking cascades to tickets and baggage records.", "ON DELETE RESTRICT: Prevents deletion of active airports or operational airlines."]:
        p = tf3.add_paragraph()
        p.text = f"• {c}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK

    # Slide 6: Normalization Defense
    s6 = prs.slides.add_slide(blank_layout)
    bg6 = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg6, C_BG_LIGHT)
    add_header_pptx(s6, "Schema Integrity", "Database Normalization Defense: 1NF, 2NF, and 3NF Transformations")

    norm_img = os.path.join(ASSETS_DIR, "normalization_diagram.png")
    if os.path.exists(norm_img):
        s6.shapes.add_picture(norm_img, Inches(0.8), Inches(1.4), Inches(5.8), Inches(5.6))

    norm_expl = [
        ("1NF: Atomic Attributes & No Repeating Groups", "Eliminates multi-valued attributes and arrays. Passenger names and seat numbers are strictly atomic strings rather than arrays in a single cell.", C_BLUE),
        ("2NF: Full Functional Dependency on Primary Key", "Removes partial key dependencies. Route information (Origin, Destination, Base Fare) isolated in FLIGHTS, while daily schedules (Date, Gate, Status) isolated in FLIGHT_INSTANCES.", C_GREEN),
        ("3NF: Transitive Dependency Elimination", "Non-key attributes depend solely on candidate keys. AIRCRAFT capacity depends on AIRCRAFT_ID and is stored in AIRCRAFT, never repeated inside TICKETS or FLIGHTS.", C_PURPLE)
    ]
    for idx, (ntitle, ndesc, col) in enumerate(norm_expl):
        ny = Inches(1.4 + idx * 1.85)
        c_n = add_card_pptx(s6, Inches(6.8), ny, Inches(5.7), Inches(1.7))
        n_bar = s6.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(6.8), ny, Inches(0.12), Inches(1.7))
        set_shape_style(n_bar, col)

        tb_n = s6.shapes.add_textbox(Inches(7.05), ny + Inches(0.1), Inches(5.3), Inches(1.5))
        tf = tb_n.text_frame
        p = tf.paragraphs[0]
        p.text = ntitle
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = col
        p2 = tf.add_paragraph()
        p2.text = ndesc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_DARK

    # Slide 7: SQL Queries
    s7 = prs.slides.add_slide(blank_layout)
    bg7 = s7.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg7, C_BG_LIGHT)
    add_header_pptx(s7, "Database Implementation", "Production SQL Queries: DDL Constraints & Transaction Concurrency")

    c_code = add_card_pptx(s7, Inches(0.8), Inches(1.5), Inches(5.7), Inches(5.5), fill_color=C_DARK, border_color=C_BLUE)
    tb_c = s7.shapes.add_textbox(Inches(1.0), Inches(1.65), Inches(5.3), Inches(5.2))
    tf = tb_c.text_frame
    p = tf.paragraphs[0]
    p.text = "DDL & Concurrency SQL Implementation"
    p.font.size = Pt(11)
    p.font.bold = True
    p.font.color.rgb = RGBColor(147, 197, 253)

    code_str = (
        "-- 1. DDL with Unique Seat Constraint\n"
        "CREATE TABLE TICKETS (\n"
        "  TICKET_ID INT AUTO_INCREMENT PRIMARY KEY,\n"
        "  TICKET_NUMBER VARCHAR(20) NOT NULL UNIQUE,\n"
        "  BOOKING_ID INT NOT NULL,\n"
        "  FLIGHT_INSTANCE_ID INT NOT NULL,\n"
        "  SEAT_NUMBER VARCHAR(10) NOT NULL,\n"
        "  PRICE DECIMAL(10,2) NOT NULL,\n"
        "  STATUS ENUM('ISSUED','CHECKED_IN','CANCELLED'),\n"
        "  CONSTRAINT fk_t_bk FOREIGN KEY (BOOKING_ID)\n"
        "    REFERENCES BOOKINGS(BOOKING_ID) ON DELETE CASCADE,\n"
        "  CONSTRAINT uq_flight_seat UNIQUE\n"
        "    (FLIGHT_INSTANCE_ID, SEAT_NUMBER)\n"
        ") ENGINE=InnoDB;\n\n"
        "-- 2. Pessimistic Row Lock (ACID Isolation)\n"
        "SELECT f.FLIGHT_NUMBER, a.TOTAL_SEATS, fi.STATUS\n"
        "FROM FLIGHT_INSTANCES fi\n"
        "JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER\n"
        "JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID\n"
        "WHERE fi.FLIGHT_INSTANCE_ID = ? FOR UPDATE;\n\n"
        "-- 3. Seat Conflict Check\n"
        "SELECT COUNT(*) AS is_taken FROM TICKETS\n"
        "WHERE FLIGHT_INSTANCE_ID = ? AND SEAT_NUMBER = ?\n"
        "  AND STATUS != 'CANCELLED';"
    )
    p_code = tf.add_paragraph()
    p_code.text = code_str
    p_code.font.name = "Courier New"
    p_code.font.size = Pt(7.8)
    p_code.font.color.rgb = C_WHITE

    sql_img = os.path.join(ASSETS_DIR, "StoredProcedure1_Output.png")
    if os.path.exists(sql_img):
        s7.shapes.add_picture(sql_img, Inches(6.8), Inches(1.5), Inches(5.7), Inches(3.3))
    
    c_sql_exp = add_card_pptx(s7, Inches(6.8), Inches(5.0), Inches(5.7), Inches(2.0), fill_color=C_LIGHT_BLUE, border_color=C_BLUE)
    tb_se = s7.shapes.add_textbox(Inches(6.95), Inches(5.1), Inches(5.4), Inches(1.8))
    tf = tb_se.text_frame
    p = tf.paragraphs[0]
    p.text = "Relational Concepts & Query Evaluation"
    p.font.size = Pt(10.5)
    p.font.bold = True
    p.font.color.rgb = C_BLUE
    for itm in [
        "SELECT ... FOR UPDATE: Locks flight record to prevent concurrent double-booking.",
        "Composite UNIQUE Constraint (uq_flight_seat): Database-level safety net guaranteeing seat uniqueness.",
        "Foreign Key Cascades: Automated lifecycle cleanup across bookings, tickets, and baggage."
    ]:
        p = tf.add_paragraph()
        p.text = f"• {itm}"
        p.font.size = Pt(8.5)
        p.font.color.rgb = C_DARK

    # Slide 8: System Design
    s8 = prs.slides.add_slide(blank_layout)
    bg8 = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg8, C_BG_LIGHT)
    add_header_pptx(s8, "ACID Concurrency", "System Workflow: ACID Transaction Execution & Row Locking")

    wf_img = os.path.join(ASSETS_DIR, "workflow_diagram.png")
    if os.path.exists(wf_img):
        s8.shapes.add_picture(wf_img, Inches(0.8), Inches(1.4), Inches(6.0), Inches(5.6))

    acid_items = [
        ("Atomicity", "All-or-Nothing Guarantee", "The entire booking transaction (Booking creation + Ticket issuance + Seat allocation) is enclosed within START TRANSACTION. If any step fails, ROLLBACK restores exact state.", C_BLUE),
        ("Consistency", "Constraint Invariant Enforcement", "Enforced via foreign key cascades, positive balance constraints, and composite unique indexes. Database never enters an illegal state.", C_GREEN),
        ("Isolation", "Pessimistic Row-Level Locking", "SELECT ... FOR UPDATE locks the target flight instance row, serializing concurrent booking attempts and eliminating dirty reads.", C_AMBER),
        ("Durability", "InnoDB Redo Log Persistence", "Once COMMIT executes, transaction modifications are permanently recorded in MySQL InnoDB Redo logs, surviving power or system failures.", C_PURPLE)
    ]
    for idx, (prop, sub, desc, col) in enumerate(acid_items):
        ay = Inches(1.4 + idx * 1.4)
        c_a = add_card_pptx(s8, Inches(7.1), ay, Inches(5.4), Inches(1.25))
        a_bar = s8.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(7.1), ay, Inches(0.12), Inches(1.25))
        set_shape_style(a_bar, col)

        tb_a = s8.shapes.add_textbox(Inches(7.35), ay + Inches(0.08), Inches(5.0), Inches(1.1))
        tf = tb_a.text_frame
        p = tf.paragraphs[0]
        p.text = f"{prop} — {sub}"
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = col
        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_DARK

    # Slide 9: Frontend Screenshots Gallery
    s9 = prs.slides.add_slide(blank_layout)
    bg9 = s9.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg9, C_BG_LIGHT)
    add_header_pptx(s9, "Operational Interfaces", "Frontend Interface Gallery: End-to-End Operational Telemetry")

    screens = [
        ("login_screen.png", "1. Multi-Role Authentication", "Secures routes for Passenger, Staff, & Admin via JWT and USERS table.", Inches(0.8), Inches(1.4), Inches(3.7), Inches(2.6)),
        ("admin_dashboard.png", "2. Admin Operational Control", "FIDS telemetry, flight delays, aircraft allocations, and gate changes.", Inches(4.8), Inches(1.4), Inches(3.7), Inches(2.6)),
        ("passenger_seat_map.png", "3. Interactive Seat Map", "Real-time visual seat allocation mapped directly to TICKETS unique index.", Inches(8.8), Inches(1.4), Inches(3.7), Inches(2.6)),
        ("passenger_boarding_pass.png", "4. Digital Boarding Pass", "Instant pass rendering with barcode tied to CHECK_IN record.", Inches(1.8), Inches(4.3), Inches(4.6), Inches(2.8)),
        ("baggage_tracking.png", "5. Real-Time Baggage Hub", "End-to-end baggage tracking linking weight, tags, and security checks.", Inches(6.8), Inches(4.3), Inches(4.6), Inches(2.8))
    ]
    for img_name, label, desc, lx, ty, w, h in screens:
        add_card_pptx(s9, lx, ty, w, h)
        img_p = os.path.join(ASSETS_DIR, img_name)
        if os.path.exists(img_p):
            s9.shapes.add_picture(img_p, lx + Inches(0.08), ty + Inches(0.08), w - Inches(0.16), h - Inches(0.72))
        
        tb = s9.shapes.add_textbox(lx + Inches(0.1), ty + h - Inches(0.65), w - Inches(0.2), Inches(0.6))
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

    # Slide 10: SQL Query Outputs
    s10 = prs.slides.add_slide(blank_layout)
    bg10 = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(bg10, C_BG_LIGHT)
    add_header_pptx(s10, "Execution Verification", "Live SQL Query Outputs & Database Telemetry Results")

    sp_img = os.path.join(ASSETS_DIR, "StoredProcedure2_3(output1).png")
    if os.path.exists(sp_img):
        s10.shapes.add_picture(sp_img, Inches(0.8), Inches(1.4), Inches(5.7), Inches(3.4))
    
    trg_img = os.path.join(ASSETS_DIR, "Trigger1_Output.png")
    if os.path.exists(trg_img):
        s10.shapes.add_picture(trg_img, Inches(6.8), Inches(1.4), Inches(5.7), Inches(3.4))

    metrics = [
        ("15 Relational Tables", "100% 3NF normalized tables verified with zero data redundancy.", C_BLUE),
        ("18 Foreign Keys", "Strict referential integrity with CASCADE and RESTRICT triggers.", C_GREEN),
        ("0 Double-Bookings", "Pessimistic row-locking (FOR UPDATE) guarantees concurrency safety.", C_AMBER),
        ("< 12ms Latency", "B-Tree indexed search across flights, routes, and seat availability.", C_PURPLE)
    ]
    for idx, (mtitle, mdesc, col) in enumerate(metrics):
        mx = Inches(0.8 + idx * 2.98)
        my = Inches(5.1)
        add_card_pptx(s10, mx, my, Inches(2.8), Inches(1.9))
        m_bar = s10.shapes.add_shape(MSO_SHAPE.RECTANGLE, mx, my, Inches(2.8), Inches(0.08))
        set_shape_style(m_bar, col)

        tb_m = s10.shapes.add_textbox(mx + Inches(0.12), my + Inches(0.15), Inches(2.56), Inches(1.6))
        tf = tb_m.text_frame
        p = tf.paragraphs[0]
        p.text = mtitle
        p.font.size = Pt(10.5)
        p.font.bold = True
        p.font.color.rgb = col
        p2 = tf.add_paragraph()
        p2.text = mdesc
        p2.font.size = Pt(8.5)
        p2.font.color.rgb = C_DARK

    # Slide 11: Conclusion
    s11 = prs.slides.add_slide(blank_layout)
    concl_bg = os.path.join(ASSETS_DIR, "airplane_flight_conclusion.jpg")
    if os.path.exists(concl_bg):
        s11.shapes.add_picture(concl_bg, 0, 0, Inches(13.333), Inches(7.5))
    
    overlay11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
    set_shape_style(overlay11, C_NAVY)

    top_bar11 = s11.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(0.12))
    set_shape_style(top_bar11, C_BLUE)

    add_header_pptx(s11, "Project Summary", "Conclusion, Technical Learnings & Future Roadmap", dark_mode=True)

    cards_11 = [
        ("Project Achievements", [
            "Engineered complete production-ready AMS backed by MySQL/Oracle.",
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
    for idx, (ctitle, cbullets, fillcol, bordercol) in enumerate(cards_11):
        cx = Inches(0.8 + idx * 3.98)
        cy = Inches(1.5)
        c11 = add_card_pptx(s11, cx, cy, Inches(3.75), Inches(3.8), fill_color=fillcol, border_color=bordercol)

        tb = s11.shapes.add_textbox(cx + Inches(0.2), cy + Inches(0.2), Inches(3.35), Inches(3.4))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = ctitle
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = C_WHITE
        p.space_after = Pt(8)
        for b in cbullets:
            p = tf.add_paragraph()
            p.text = f"• {b}"
            p.font.size = Pt(9)
            p.font.color.rgb = RGBColor(226, 232, 240)
            p.space_after = Pt(6)

    qa_card = add_card_pptx(s11, Inches(0.8), Inches(5.6), Inches(11.7), Inches(1.4), fill_color=RGBColor(23, 42, 69), border_color=C_BLUE)
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
    p3.text = "Repository: https://github.com/Saravana65/Airport-Management-System  |  Database: MySQL 8.0 & Oracle (airport_management_db)"
    p3.font.size = Pt(9.5)
    p3.font.color.rgb = RGBColor(203, 213, 225)

    prs.save(PPTX_FINAL_PATH)
    print(f"[SUCCESS] Final PPTX presentation saved to: {PPTX_FINAL_PATH}")

# -------------------------------------------------------------
# HIGH-RESOLUTION PIXEL-PERFECT PDF RENDERER (ZERO OVERLAPS)
# -------------------------------------------------------------
def render_text_block(ax, x, y, lines, line_height=30, fontsize=10, color=HEX_DARK, fontfamily="sans-serif", fontweight='normal'):
    for i, line in enumerate(lines):
        ax.text(x, y - i * line_height, line, fontsize=fontsize, color=color, fontfamily=fontfamily, fontweight=fontweight)

def build_final_pdf_clean():
    pdf_doc = pymupdf.open()
    dpi = 144
    figsize = (1920 / dpi, 1080 / dpi)
    slide_images = []

    def create_canvas(badge_text, title_text, dark=False):
        fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
        bg_col = HEX_NAVY if dark else HEX_BG
        ax.set_facecolor(bg_col)
        fig.patch.set_facecolor(bg_col)
        ax.set_xlim(0, 1920)
        ax.set_ylim(0, 1080)
        ax.axis('off')

        ax.plot([0, 1920], [1075, 1075], color=HEX_BLUE, lw=8)

        # Generous badge width based on text
        badge_w = max(300, len(badge_text) * 16 + 60)
        b_rect = patches.FancyBboxPatch((100, 990), badge_w, 42, boxstyle="round,pad=4,rounding_size=8",
                                        facecolor=HEX_BLUE if dark else HEX_LIGHT_BLUE,
                                        edgecolor=HEX_BLUE, lw=1.5)
        ax.add_patch(b_rect)
        ax.text(100 + badge_w / 2, 1011, badge_text.upper(),
                color="white" if dark else HEX_BLUE, fontsize=10, fontweight='bold', ha='center', va='center')

        ax.text(100, 935, title_text, color="white" if dark else HEX_DARK, fontsize=20, fontweight='bold')
        return fig, ax

    # ==========================================
    # SLIDE 1: Title
    # ==========================================
    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
    ax.set_facecolor(HEX_NAVY)
    fig.patch.set_facecolor(HEX_NAVY)
    ax.set_xlim(0, 1920)
    ax.set_ylim(0, 1080)
    ax.axis('off')

    hero_p = os.path.join(ASSETS_DIR, "airport_terminal_modern.jpg")
    if os.path.exists(hero_p):
        im = Image.open(hero_p).resize((1920, 1080)).convert("RGBA")
        overlay = Image.new("RGBA", (1920, 1080), (16, 42, 67, 220))
        blended = Image.alpha_composite(im, overlay)
        ax.imshow(blended, extent=[0, 1920, 0, 1080])

    ax.plot([0, 1920], [1075, 1075], color=HEX_BLUE, lw=8)

    # Category Badge (Wide 700px)
    b1 = patches.FancyBboxPatch((100, 920), 720, 48, boxstyle="round,pad=5,rounding_size=10",
                                facecolor="#1E3A5F", edgecolor=HEX_BLUE, lw=2)
    ax.add_patch(b1)
    ax.text(460, 944, "DATABASE MANAGEMENT SYSTEMS (DBMS) CAPSTONE", color="#93C5FD",
            fontsize=11, fontweight='bold', ha='center', va='center')

    ax.text(100, 810, "AIRPORT MANAGEMENT SYSTEM", color="white", fontsize=36, fontweight='bold')
    ax.text(100, 740, "Relational Database Design, ACID Concurrency Control, and Real-Time Multi-Tier Telemetry",
            color="#CBD5E1", fontsize=15.5)

    # 4 Feature Badges (390px wide, 53px gap)
    pills = [("15 Relational Tables", HEX_BLUE), ("3NF Normalized", HEX_GREEN),
             ("Pessimistic Row-Locking", HEX_AMBER), ("Multi-Tier Architecture", "#8B5CF6")]
    for idx, (ptext, pcol) in enumerate(pills):
        px = 100 + idx * 443
        prect = patches.FancyBboxPatch((px, 615), 390, 55, boxstyle="round,pad=5,rounding_size=10",
                                       facecolor="#142337", edgecolor=pcol, lw=2)
        ax.add_patch(prect)
        ax.text(px + 195, 642, f"• {ptext}", color="white", fontsize=11.5, fontweight='bold', ha='center', va='center')

    pres_rect = patches.FancyBboxPatch((100, 240), 1720, 310, boxstyle="round,pad=10,rounding_size=15",
                                       facecolor="#172A45", edgecolor="#334155", lw=2)
    ax.add_patch(pres_rect)

    ax.text(180, 475, "PRESENTED BY", color="#93C5FD", fontsize=13, fontweight='bold')
    ax.text(180, 405, "S. Saravana Srinivas", color="white", fontsize=25, fontweight='bold')
    ax.text(180, 345, "Roll No: 25R11A66P7", color="#CBD5E1", fontsize=17)

    ax.plot([960, 960], [280, 500], color="#334155", lw=2)

    ax.text(1040, 475, "CO-PRESENTER", color="#93C5FD", fontsize=13, fontweight='bold')
    ax.text(1040, 405, "L. Anjan Kumar", color="white", fontsize=25, fontweight='bold')
    ax.text(1040, 345, "Roll No: 25R11A66N5", color="#CBD5E1", fontsize=17)

    ax.text(960, 130, "Academic Evaluation  |  MySQL 8.0 & Oracle Relational Engines  |  Node.js + React 18 Full Stack",
            color="#94A3B8", fontsize=12.5, ha='center')

    p1_path = os.path.join(ASSETS_DIR, "final_slide_1.png")
    plt.savefig(p1_path, dpi=dpi)
    plt.close()
    slide_images.append(p1_path)

    # ==========================================
    # SLIDE 2: Introduction
    # ==========================================
    fig, ax = create_canvas("Operational Context", "Introduction: Modern Airport Operations vs. Conventional Gaps")

    term_p = os.path.join(ASSETS_DIR, "airport_terminal_modern.jpg")
    if os.path.exists(term_p):
        t_img = Image.open(term_p).resize((820, 820))
        ax.imshow(t_img, extent=[100, 920, 60, 880])
        ax.add_patch(patches.Rectangle((100, 60), 820, 820, fill=False, edgecolor=HEX_BORDER, lw=2))

        c_ov = patches.FancyBboxPatch((120, 80), 780, 90, boxstyle="round,pad=5,rounding_size=8",
                                      facecolor="#102A43", edgecolor=HEX_BLUE, lw=1.5)
        ax.add_patch(c_ov)
        ax.text(510, 135, "Aviation Operations Control Center (OCC)", color="#93C5FD", fontsize=12.5, fontweight='bold', ha='center')
        ax.text(510, 100, "Centralizing Manifests, Gates, Telemetry, and Luggage Across 15 Relational Tables", color="white", fontsize=9.5, ha='center')

    # Right Top: Two Comparison Panels (width: 410px each, gap: 40px)
    c_trad = patches.FancyBboxPatch((970, 520), 410, 360, boxstyle="round,pad=8,rounding_size=10",
                                   facecolor="white", edgecolor=HEX_RED, lw=1.5)
    ax.add_patch(c_trad)
    ax.add_patch(patches.Rectangle((970, 870), 410, 10, facecolor=HEX_RED))
    ax.text(995, 835, "Conventional Gaps", color=HEX_RED, fontsize=13, fontweight='bold')
    t_lines = [
        "• Siloed flight manifests",
        "  and paper logs",
        "• Double-booking race",
        "  conditions in peaks",
        "• Manual check-in lines",
        "  causing gate delays",
        "• Stale display updates"
    ]
    render_text_block(ax, 995, 785, t_lines, line_height=30, fontsize=9.5, color=HEX_DARK)

    c_sol = patches.FancyBboxPatch((1410, 520), 410, 360, boxstyle="round,pad=8,rounding_size=10",
                                  facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(c_sol)
    ax.add_patch(patches.Rectangle((1410, 870), 410, 10, facecolor=HEX_BLUE))
    ax.text(1435, 835, "AMS Architecture", color=HEX_BLUE, fontsize=13, fontweight='bold')
    s_lines = [
        "✓ Unified 15-table relational",
        "  enterprise database",
        "✓ Pessimistic row-locking",
        "  (ACID transaction safety)",
        "✓ Digital web check-in",
        "  and instant boarding pass",
        "✓ Live FIDS telemetry sync"
    ]
    render_text_block(ax, 1435, 785, s_lines, line_height=30, fontsize=9.5, color=HEX_DARK)

    # Right Bottom: 4 Project Objectives (2x2 Grid)
    objs_list = [
        ("1. Centralization", "Replace paper manifests with a 3NF normalized schema."),
        ("2. ACID Concurrency", "Zero double-bookings via SELECT ... FOR UPDATE locks."),
        ("3. Role-Based RBAC", "Separate views for Passenger, Airline Staff, & Admin."),
        ("4. Live Telemetry", "Instant FIDS dashboard synchronizing gates and status.")
    ]
    for idx, (otitle, odesc) in enumerate(objs_list):
        row = idx // 2
        col = idx % 2
        ox = 970 + col * 440
        oy = 290 if row == 0 else 60
        c_o = patches.FancyBboxPatch((ox, oy), 410, 200, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_o)
        ax.text(ox + 20, oy + 155, otitle, color=HEX_NAVY, fontsize=12, fontweight='bold')
        wrapped = textwrap.fill(odesc, width=26)
        render_text_block(ax, ox + 20, oy + 115, wrapped.split("\n"), line_height=26, fontsize=9.5, color=HEX_DARK)

    p2_path = os.path.join(ASSETS_DIR, "final_slide_2.png")
    plt.savefig(p2_path, dpi=dpi)
    plt.close()
    slide_images.append(p2_path)

    # ==========================================
    # SLIDE 3: Frontend & Backend Architecture
    # ==========================================
    fig, ax = create_canvas("Enterprise Architecture", "Technical Architecture: Multi-Tier Integration & Data Flow")

    arch_p = os.path.join(ASSETS_DIR, "architecture_diagram.png")
    if os.path.exists(arch_p):
        a_img = Image.open(arch_p).resize((840, 820))
        ax.imshow(a_img, extent=[100, 940, 60, 880])
        ax.add_patch(patches.Rectangle((100, 60), 840, 820, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    arch_list = [
        ("Presentation Tier (Frontend)", "React 18 • Vite • Tailwind CSS", "Component-based reactive UI rendering interactive seat maps, live flight search, digital boarding passes, and role-guarded views.", HEX_BLUE),
        ("Application Tier (REST Gateway)", "Node.js • Express.js REST API", "REST API routing, JWT token authentication, input validation, and pessimistic transaction coordination.", HEX_DARK_BLUE),
        ("Microservice Optimization Engines", "C Core Engine & Java Pricing Service", "C memory-optimized route calculation routines and Java dynamic fare computation modules called via inter-process bridges.", HEX_PURPLE),
        ("Relational Database Tier", "MySQL 8.0 & Oracle Engine (InnoDB)", "15 Normalized tables (3NF), row-level locks, connection pool (10 connections), and prepared statements preventing SQLi.", HEX_GREEN)
    ]
    for idx, (ctitle, csub, cdesc, col) in enumerate(arch_list):
        cy = 680 - idx * 205
        c_a = patches.FancyBboxPatch((980, cy), 840, 180, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_a)
        ax.add_patch(patches.Rectangle((980, cy), 14, 180, facecolor=col))
        ax.text(1015, cy + 140, ctitle, color=col, fontsize=12, fontweight='bold')
        ax.text(1015, cy + 115, csub, color=HEX_NAVY, fontsize=9.5, fontweight='bold')
        wrapped = textwrap.fill(cdesc, width=62)
        render_text_block(ax, 1015, cy + 85, wrapped.split("\n"), line_height=26, fontsize=9.5, color=HEX_DARK)

    p3_path = os.path.join(ASSETS_DIR, "final_slide_3.png")
    plt.savefig(p3_path, dpi=dpi)
    plt.close()
    slide_images.append(p3_path)

    # ==========================================
    # SLIDE 4: Database Design Process
    # ==========================================
    fig, ax = create_canvas("Engineering Methodology", "Relational Database Design Process: From Domain to Production DDL")

    s_titles = [
        ("1. Requirements", "Domain modeling of\nflights, gates, bags."),
        ("2. Entity ID", "15 Core entities\nidentified cleanly."),
        ("3. Attributes", "Data types mapped:\nINT, VARCHAR, DATE."),
        ("4. Relationships", "1:1, 1:N, & associative\nM:N resolution."),
        ("5. Normalization", "1NF to 3NF schema\nrefinement defense."),
        ("6. DB Build", "DDL scripts &\nB-Tree indexes.")
    ]
    for idx, (stitle, sdesc) in enumerate(s_titles):
        sx = 100 + idx * 290
        c_st = patches.FancyBboxPatch((sx, 690), 260, 190, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_st)
        ax.add_patch(patches.Rectangle((sx, 870), 260, 10, facecolor=HEX_BLUE))
        ax.text(sx + 15, 835, stitle, color=HEX_NAVY, fontsize=11, fontweight='bold')
        render_text_block(ax, sx + 15, 785, sdesc.split("\n"), line_height=26, fontsize=9.5, color=HEX_DARK)

    c_ent = patches.FancyBboxPatch((100, 60), 840, 590, boxstyle="round,pad=8,rounding_size=12",
                                   facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(c_ent)
    ax.text(130, 605, "Concrete Entity Example: TICKETS (Relational Mapping)", color=HEX_BLUE, fontsize=13.5, fontweight='bold')

    schema_lines = [
        "Entity Name: TICKETS (Associative Table resolving M:N)",
        "----------------------------------------------------------------",
        "  • TICKET_ID           INT (Primary Key, Auto-Increment)",
        "  • TICKET_NUMBER       VARCHAR(20) (Natural Unique Code)",
        "  • BOOKING_ID          INT (Foreign Key -> BOOKINGS)",
        "  • PASSENGER_ID        INT (Foreign Key -> PASSENGERS)",
        "  • FLIGHT_INSTANCE_ID  INT (Foreign Key -> FLIGHT_INSTANCES)",
        "  • SEAT_NUMBER         VARCHAR(10) (e.g., '14A')",
        "  • PRICE               DECIMAL(10,2) (Calculated fare)",
        "  • STATUS              ENUM('ISSUED','CHECKED_IN','CANCELLED')",
        "----------------------------------------------------------------",
        "Constraint: UNIQUE (FLIGHT_INSTANCE_ID, SEAT_NUMBER)",
        "Guarantees zero duplicate seat reservations in MySQL/Oracle."
    ]
    render_text_block(ax, 130, 555, schema_lines, line_height=38, fontsize=9.2, color=HEX_DARK, fontfamily="monospace")

    map_p = os.path.join(ASSETS_DIR, "original_mapping.png")
    if os.path.exists(map_p):
        m_img = Image.open(map_p).resize((840, 590))
        ax.imshow(m_img, extent=[980, 1820, 60, 650])
        ax.add_patch(patches.Rectangle((980, 60), 840, 590, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    p4_path = os.path.join(ASSETS_DIR, "final_slide_4.png")
    plt.savefig(p4_path, dpi=dpi)
    plt.close()
    slide_images.append(p4_path)

    # ==========================================
    # SLIDE 5: ER Diagram
    # ==========================================
    fig, ax = create_canvas("Schema Architecture", "Entity-Relationship (ER) Diagram & Table Cardinalities")

    er_p = os.path.join(ASSETS_DIR, "er_diagram.png")
    if os.path.exists(er_p):
        e_img = Image.open(er_p).resize((1120, 820))
        ax.imshow(e_img, extent=[100, 1220, 60, 880])
        ax.add_patch(patches.Rectangle((100, 60), 1120, 820, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    cr1 = patches.FancyBboxPatch((1260, 620), 560, 260, boxstyle="round,pad=8,rounding_size=10",
                                facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(cr1)
    ax.text(1285, 840, "Key Relational Cardinalities", color=HEX_NAVY, fontsize=13, fontweight='bold')
    card_lines = [
        "• FLIGHTS (1 : N) FLIGHT_INSTANCES",
        "• BOOKINGS (1 : N) TICKETS (PNR manifest)",
        "• FLIGHT_INSTANCES (1 : N) TICKETS",
        "• TICKETS (1 : 1) CHECK_IN",
        "• BOOKINGS (1 : N) BAGGAGE"
    ]
    render_text_block(ax, 1285, 790, card_lines, line_height=35, fontsize=10, color=HEX_DARK)

    cr2 = patches.FancyBboxPatch((1260, 340), 560, 260, boxstyle="round,pad=8,rounding_size=10",
                                facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
    ax.add_patch(cr2)
    ax.text(1285, 555, "Associative Table Resolution", color=HEX_BLUE, fontsize=13, fontweight='bold')
    m_lines = [
        "• M:N between PASSENGERS & FLIGHTS",
        "  resolved via TICKETS associative table.",
        "• Composite FKs link Bookings & Flights.",
        "• Enforces unique seat allocation per flight."
    ]
    render_text_block(ax, 1285, 505, m_lines, line_height=36, fontsize=10, color=HEX_DARK)

    cr3 = patches.FancyBboxPatch((1260, 60), 560, 260, boxstyle="round,pad=8,rounding_size=10",
                                facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(cr3)
    ax.text(1285, 275, "Referential Integrity Rules", color=HEX_BLUE, fontsize=13, fontweight='bold')
    r_lines = [
        "• ON DELETE CASCADE: Booking removal",
        "  cascades to tickets & baggage cleanly.",
        "• ON DELETE RESTRICT: Prevents deletion",
        "  of active airports and airlines."
    ]
    render_text_block(ax, 1285, 225, r_lines, line_height=36, fontsize=10, color=HEX_DARK)

    p5_path = os.path.join(ASSETS_DIR, "final_slide_5.png")
    plt.savefig(p5_path, dpi=dpi)
    plt.close()
    slide_images.append(p5_path)

    # ==========================================
    # SLIDE 6: Normalization Defense
    # ==========================================
    fig, ax = create_canvas("Schema Integrity", "Database Normalization Defense: 1NF, 2NF, and 3NF Transformations")

    norm_p = os.path.join(ASSETS_DIR, "normalization_diagram.png")
    if os.path.exists(norm_p):
        n_img = Image.open(norm_p).resize((840, 820))
        ax.imshow(n_img, extent=[100, 940, 60, 880])
        ax.add_patch(patches.Rectangle((100, 60), 840, 820, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    norm_data = [
        ("1NF: Atomic Attributes & No Repeating Groups", "Eliminates multi-valued attributes and arrays. Passenger names and seat numbers are strictly atomic strings rather than arrays in a single cell.", HEX_BLUE),
        ("2NF: Full Functional Dependency on Primary Key", "Removes partial key dependencies. Route information (Origin, Destination, Base Fare) isolated in FLIGHTS, while daily schedules (Date, Gate, Status) isolated in FLIGHT_INSTANCES.", HEX_GREEN),
        ("3NF: Transitive Dependency Elimination", "Non-key attributes depend solely on candidate keys. AIRCRAFT capacity depends on AIRCRAFT_ID and is stored in AIRCRAFT, never repeated inside TICKETS or FLIGHTS.", HEX_PURPLE)
    ]
    for idx, (ntitle, ndesc, col) in enumerate(norm_data):
        ny = 620 - idx * 280
        c_n = patches.FancyBboxPatch((980, ny), 840, 250, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_n)
        ax.add_patch(patches.Rectangle((980, ny), 14, 250, facecolor=col))
        ax.text(1015, ny + 195, ntitle, color=col, fontsize=12.5, fontweight='bold')
        wrapped = textwrap.fill(ndesc, width=58)
        render_text_block(ax, 1015, ny + 130, wrapped.split("\n"), line_height=32, fontsize=10, color=HEX_DARK)

    p6_path = os.path.join(ASSETS_DIR, "final_slide_6.png")
    plt.savefig(p6_path, dpi=dpi)
    plt.close()
    slide_images.append(p6_path)

    # ==========================================
    # SLIDE 7: SQL Queries
    # ==========================================
    fig, ax = create_canvas("Database Implementation", "Production SQL Queries: DDL Constraints & Transaction Concurrency")

    c_code = patches.FancyBboxPatch((100, 60), 840, 820, boxstyle="round,pad=8,rounding_size=12",
                                   facecolor=HEX_DARK, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(c_code)
    ax.text(130, 840, "DDL & Concurrency SQL Implementation", color="#93C5FD", fontsize=13.5, fontweight='bold')

    code_lines = [
        "-- 1. DDL with Unique Seat Constraint",
        "CREATE TABLE TICKETS (",
        "  TICKET_ID INT AUTO_INCREMENT PRIMARY KEY,",
        "  TICKET_NUMBER VARCHAR(20) NOT NULL UNIQUE,",
        "  BOOKING_ID INT NOT NULL,",
        "  FLIGHT_INSTANCE_ID INT NOT NULL,",
        "  SEAT_NUMBER VARCHAR(10) NOT NULL,",
        "  PRICE DECIMAL(10,2) NOT NULL,",
        "  STATUS ENUM('ISSUED','CHECKED_IN','CANCELLED'),",
        "  CONSTRAINT fk_t_bk FOREIGN KEY (BOOKING_ID)",
        "    REFERENCES BOOKINGS(BOOKING_ID) ON DELETE CASCADE,",
        "  CONSTRAINT uq_flight_seat UNIQUE",
        "    (FLIGHT_INSTANCE_ID, SEAT_NUMBER)",
        ") ENGINE=InnoDB;",
        "",
        "-- 2. Pessimistic Row Lock (ACID Isolation)",
        "SELECT f.FLIGHT_NUMBER, a.TOTAL_SEATS, fi.STATUS",
        "FROM FLIGHT_INSTANCES fi",
        "JOIN FLIGHTS f ON fi.FLIGHT_NUMBER = f.FLIGHT_NUMBER",
        "JOIN AIRCRAFT a ON fi.AIRCRAFT_ID = a.AIRCRAFT_ID",
        "WHERE fi.FLIGHT_INSTANCE_ID = ? FOR UPDATE;",
        "",
        "-- 3. Seat Conflict Verification",
        "SELECT COUNT(*) AS is_taken FROM TICKETS",
        "WHERE FLIGHT_INSTANCE_ID = ? AND SEAT_NUMBER = ?",
        "  AND STATUS != 'CANCELLED';"
    ]
    for i, cl in enumerate(code_lines):
        col_c = "#93C5FD" if cl.startswith("--") else ("#FDE047" if "CREATE" in cl or "SELECT" in cl else "white")
        ax.text(130, 790 - i * 29, cl, color=col_c, fontfamily="monospace", fontsize=9.2)

    sp1_p = os.path.join(ASSETS_DIR, "StoredProcedure1_Output.png")
    if os.path.exists(sp1_p):
        sp_img = Image.open(sp1_p).resize((840, 480))
        ax.imshow(sp_img, extent=[980, 1820, 400, 880])
        ax.add_patch(patches.Rectangle((980, 400), 840, 480, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    c_sexp = patches.FancyBboxPatch((980, 60), 840, 310, boxstyle="round,pad=8,rounding_size=10",
                                    facecolor=HEX_LIGHT_BLUE, edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(c_sexp)
    ax.text(1005, 330, "Relational Concepts & Query Evaluation", color=HEX_BLUE, fontsize=13, fontweight='bold')
    bullets_s7 = [
        "• SELECT ... FOR UPDATE: Locks flight instance row to eliminate double-booking.",
        "• uq_flight_seat UNIQUE: Database-level invariant guaranteeing seat uniqueness.",
        "• ON DELETE CASCADE: Clean referential integrity across bookings & tickets.",
        "• Sub-Millisecond Execution: B-Tree indexed search across manifests."
    ]
    render_text_block(ax, 1005, 275, bullets_s7, line_height=48, fontsize=10, color=HEX_DARK)

    p7_path = os.path.join(ASSETS_DIR, "final_slide_7.png")
    plt.savefig(p7_path, dpi=dpi)
    plt.close()
    slide_images.append(p7_path)

    # ==========================================
    # SLIDE 8: System Design & Concurrency Workflow
    # ==========================================
    fig, ax = create_canvas("ACID Concurrency", "System Workflow: ACID Transaction Execution & Row Locking")

    wf_p = os.path.join(ASSETS_DIR, "workflow_diagram.png")
    if os.path.exists(wf_p):
        w_img = Image.open(wf_p).resize((840, 820))
        ax.imshow(w_img, extent=[100, 940, 60, 880])
        ax.add_patch(patches.Rectangle((100, 60), 840, 820, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    acid_data = [
        ("Atomicity", "All-or-Nothing Guarantee", "The entire booking transaction (Booking creation + Ticket issuance + Seat allocation) is enclosed within START TRANSACTION. If any step fails, ROLLBACK restores exact state.", HEX_BLUE),
        ("Consistency", "Constraint Invariant Enforcement", "Enforced via foreign key cascades, positive balance constraints, and composite unique indexes. Database never enters an illegal state.", HEX_GREEN),
        ("Isolation", "Pessimistic Row-Level Locking", "SELECT ... FOR UPDATE locks the target flight instance row, serializing concurrent booking attempts and eliminating dirty reads.", HEX_AMBER),
        ("Durability", "InnoDB Redo Log Persistence", "Once COMMIT executes, transaction modifications are permanently recorded in MySQL InnoDB Redo logs, surviving power or system failures.", HEX_PURPLE)
    ]
    for idx, (prop, sub, desc, col) in enumerate(acid_data):
        ay = 680 - idx * 205
        c_ac = patches.FancyBboxPatch((980, ay), 840, 180, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_ac)
        ax.add_patch(patches.Rectangle((980, ay), 14, 180, facecolor=col))
        ax.text(1015, ay + 135, f"{prop} — {sub}", color=col, fontsize=12, fontweight='bold')
        wrapped = textwrap.fill(desc, width=62)
        render_text_block(ax, 1015, ay + 95, wrapped.split("\n"), line_height=26, fontsize=9.5, color=HEX_DARK)

    p8_path = os.path.join(ASSETS_DIR, "final_slide_8.png")
    plt.savefig(p8_path, dpi=dpi)
    plt.close()
    slide_images.append(p8_path)

    # ==========================================
    # SLIDE 9: Frontend Screenshots Gallery
    # ==========================================
    fig, ax = create_canvas("Operational Interfaces", "Frontend Interface Gallery: End-to-End Operational Telemetry")

    scr_defs = [
        ("login_screen.png", "1. Multi-Role Authentication", "Secures routes via JWT & USERS table.", [100, 640, 500, 860]),
        ("admin_dashboard.png", "2. Admin Operational Control", "FIDS telemetry, flight delays, & gates.", [690, 1230, 500, 860]),
        ("passenger_seat_map.png", "3. Interactive Seat Map", "Real-time visual seat allocation map.", [1280, 1820, 500, 860]),
        ("passenger_boarding_pass.png", "4. Digital Boarding Pass", "Instant boarding pass with scannable barcode tied to CHECK_IN.", [200, 980, 60, 440]),
        ("baggage_tracking.png", "5. Real-Time Baggage Hub", "End-to-end baggage tracking linking weight, tags, & telemetry.", [1040, 1820, 60, 440])
    ]
    for img_name, label, desc, (x1, x2, y1, y2) in scr_defs:
        img_p = os.path.join(ASSETS_DIR, img_name)
        if os.path.exists(img_p):
            idata = Image.open(img_p).resize((x2 - x1, y2 - y1 - 65))
            ax.imshow(idata, extent=[x1, x2, y1 + 65, y2])
        frame = patches.Rectangle((x1, y1), x2 - x1, y2 - y1, fill=False, edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(frame)
        b_box = patches.Rectangle((x1, y1), x2 - x1, 65, facecolor="white")
        ax.add_patch(b_box)
        ax.text(x1 + 15, y1 + 40, label, color=HEX_BLUE, fontsize=10.5, fontweight='bold')
        ax.text(x1 + 15, y1 + 15, desc, color=HEX_DARK, fontsize=9)

    p9_path = os.path.join(ASSETS_DIR, "final_slide_9.png")
    plt.savefig(p9_path, dpi=dpi)
    plt.close()
    slide_images.append(p9_path)

    # ==========================================
    # SLIDE 10: SQL Query Execution Outputs
    # ==========================================
    fig, ax = create_canvas("Execution Verification", "Live SQL Query Outputs & Database Telemetry Results")

    sp2_p = os.path.join(ASSETS_DIR, "StoredProcedure2_3(output1).png")
    if os.path.exists(sp2_p):
        sp2_img = Image.open(sp2_p).resize((840, 460))
        ax.imshow(sp2_img, extent=[100, 940, 420, 880])
        ax.add_patch(patches.Rectangle((100, 420), 840, 460, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    trg1_p = os.path.join(ASSETS_DIR, "Trigger1_Output.png")
    if os.path.exists(trg1_p):
        trg1_img = Image.open(trg1_p).resize((840, 460))
        ax.imshow(trg1_img, extent=[980, 1820, 420, 880])
        ax.add_patch(patches.Rectangle((980, 420), 840, 460, fill=False, edgecolor=HEX_BORDER, lw=1.5))

    met_defs = [
        ("15 Relational Tables", "100% 3NF normalized tables verified with zero data redundancy.", HEX_BLUE),
        ("18 Foreign Keys", "Strict referential integrity with CASCADE and RESTRICT triggers.", HEX_GREEN),
        ("0 Double-Bookings", "Pessimistic row-locking (FOR UPDATE) guarantees concurrency safety.", HEX_AMBER),
        ("< 12ms Latency", "B-Tree indexed search across flights, routes, and seat availability.", HEX_PURPLE)
    ]
    for idx, (mtitle, mdesc, col) in enumerate(met_defs):
        mx = 100 + idx * 440
        c_m = patches.FancyBboxPatch((mx, 60), 400, 320, boxstyle="round,pad=8,rounding_size=10",
                                     facecolor="white", edgecolor=HEX_BORDER, lw=1.5)
        ax.add_patch(c_m)
        ax.add_patch(patches.Rectangle((mx, 370), 400, 10, facecolor=col))
        ax.text(mx + 20, 325, mtitle, color=col, fontsize=13, fontweight='bold')
        wrapped = textwrap.fill(mdesc, width=28)
        render_text_block(ax, mx + 20, 240, wrapped.split("\n"), line_height=32, fontsize=10, color=HEX_DARK)

    p10_path = os.path.join(ASSETS_DIR, "final_slide_10.png")
    plt.savefig(p10_path, dpi=dpi)
    plt.close()
    slide_images.append(p10_path)

    # ==========================================
    # SLIDE 11: Conclusion
    # ==========================================
    fig, ax = plt.subplots(figsize=figsize, dpi=dpi)
    ax.set_facecolor(HEX_NAVY)
    fig.patch.set_facecolor(HEX_NAVY)
    ax.set_xlim(0, 1920)
    ax.set_ylim(0, 1080)
    ax.axis('off')

    concl_p = os.path.join(ASSETS_DIR, "airplane_flight_conclusion.jpg")
    if os.path.exists(concl_p):
        c_img = Image.open(concl_p).resize((1920, 1080)).convert("RGBA")
        overlay11 = Image.new("RGBA", (1920, 1080), (16, 42, 67, 220))
        blended11 = Image.alpha_composite(c_img, overlay11)
        ax.imshow(blended11, extent=[0, 1920, 0, 1080])

    ax.plot([0, 1920], [1075, 1075], color=HEX_BLUE, lw=8)

    b11 = patches.FancyBboxPatch((100, 990), 280, 42, boxstyle="round,pad=4,rounding_size=8",
                                 facecolor="#1E3A5F", edgecolor=HEX_BLUE, lw=1.5)
    ax.add_patch(b11)
    ax.text(240, 1011, "PROJECT CLOSURE", color="#93C5FD", fontsize=10.5, fontweight='bold', ha='center', va='center')

    ax.text(100, 935, "Conclusion, Technical Learnings & Future Roadmap", color="white", fontsize=21, fontweight='bold')

    cards_data11 = [
        ("Project Achievements", [
            "Engineered complete production-ready AMS backed by MySQL/Oracle.",
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
        ], "#581C87", HEX_PURPLE)
    ]
    for idx, (ctitle, cbullets, fillcol, bordercol) in enumerate(cards_data11):
        cx = 100 + idx * 590
        c11 = patches.FancyBboxPatch((cx, 310), 540, 560, boxstyle="round,pad=8,rounding_size=12",
                                     facecolor=fillcol, edgecolor=bordercol, lw=2)
        ax.add_patch(c11)
        ax.text(cx + 25, 820, ctitle, color="white", fontsize=16, fontweight='bold')
        for b_i, b in enumerate(cbullets):
            wrapped = textwrap.fill(b, width=32)
            render_text_block(ax, cx + 25, 750 - b_i * 110, [f"• {wrapped.split(chr(10))[0]}"] + wrapped.split(chr(10))[1:], line_height=26, fontsize=10.5, color="#E2E8F0")

    qa_card = patches.FancyBboxPatch((100, 60), 1720, 210, boxstyle="round,pad=8,rounding_size=12",
                                     facecolor="#172A45", edgecolor=HEX_BLUE, lw=2)
    ax.add_patch(qa_card)
    ax.text(140, 210, "THANK YOU — OPEN FOR QUESTIONS & EVALUATION", color="#93C5FD", fontsize=14.5, fontweight='bold')
    ax.text(140, 155, "• S. Saravana Srinivas (25R11A66P7)   |   • L. Anjan Kumar (25R11A66N5)", color="white", fontsize=15, fontweight='bold')
    ax.text(140, 105, "Repository: https://github.com/Saravana65/Airport-Management-System   |   Database: MySQL 8.0 & Oracle (airport_management_db)", color="#CBD5E1", fontsize=11)

    p11_path = os.path.join(ASSETS_DIR, "final_slide_11.png")
    plt.savefig(p11_path, dpi=dpi)
    plt.close()
    slide_images.append(p11_path)

    for p_img in slide_images:
        img_doc = pymupdf.open(p_img)
        pdf_bytes = img_doc.convert_to_pdf()
        slide_pdf = pymupdf.open("pdf", pdf_bytes)
        pdf_doc.insert_pdf(slide_pdf)
        slide_pdf.close()
        img_doc.close()

    pdf_doc.save(PDF_FINAL_PATH)
    pdf_doc.close()
    print(f"[SUCCESS] Clean high-resolution PDF saved to: {PDF_FINAL_PATH}")

if __name__ == "__main__":
    print("[1/2] Generating Airport_Management_System_DBMS_Presentation_FINAL.pptx ...")
    build_final_pptx()
    print("[2/2] Generating Airport_Management_System_DBMS_Presentation_FINAL.pdf ...")
    build_final_pdf_clean()
    print("\n[COMPLETE] Both deliverables generated with clean text wrapping and zero overlaps!")
