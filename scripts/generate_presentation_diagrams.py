"""
Generate High-Resolution Presentation Diagrams for Airport Management System DBMS PPT
Diagrams:
1. er_diagram.png - Professional Relational ER Diagram
2. architecture_diagram.png - 4-Tier Full-Stack Architecture
3. workflow_diagram.png - ACID Transaction Booking & Check-in Flow
4. normalization_diagram.png - 1NF, 2NF, 3NF Normalization Decomposition
"""

import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as patches

OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../presentation_assets'))
os.makedirs(OUTPUT_DIR, exist_ok=True)

# -------------------------------------------------------------
# 1. ER DIAGRAM
# -------------------------------------------------------------
def generate_er_diagram():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    ax.axis('off')

    # Title
    ax.text(0.5, 0.96, 'Airport Management System — Relational Entity-Relationship (ER) Schema',
            ha='center', va='top', fontsize=18, fontweight='bold', color='#102A43')
    ax.text(0.5, 0.93, 'Normalized 3NF Architecture with Composite Keys & Referential Integrity Constraints',
            ha='center', va='top', fontsize=11, color='#64748B')

    # Entity box definition helper
    def draw_entity(x, y, w, h, title, pk_list, fk_list, attr_list, tag='ENTITY'):
        # Header box
        header_h = 0.038
        header = patches.FancyBboxPatch((x, y + h - header_h), w, header_h,
                                        boxstyle="round,pad=0.005,rounding_size=0.008",
                                        facecolor='#102A43', edgecolor='#102A43', linewidth=1)
        ax.add_patch(header)
        ax.text(x + 0.01, y + h - header_h / 2, title, ha='left', va='center',
                fontsize=9.5, fontweight='bold', color='#FFFFFF')
        ax.text(x + w - 0.01, y + h - header_h / 2, tag, ha='right', va='center',
                fontsize=7.5, fontweight='bold', color='#93C5FD')

        # Body box
        body = patches.FancyBboxPatch((x, y), w, h - header_h,
                                      boxstyle="round,pad=0.005,rounding_size=0.008",
                                      facecolor='#FFFFFF', edgecolor='#CBD5E1', linewidth=1)
        ax.add_patch(body)

        # Lines inside
        curr_y = y + h - header_h - 0.018
        for pk in pk_list:
            ax.text(x + 0.01, curr_y, f"[PK] {pk}", ha='left', va='center',
                    fontsize=8, fontweight='bold', color='#B91C1C')
            curr_y -= 0.017
        for fk in fk_list:
            ax.text(x + 0.01, curr_y, f"[FK] {fk}", ha='left', va='center',
                    fontsize=8, fontweight='semibold', color='#2563EB')
            curr_y -= 0.017
        for attr in attr_list:
            ax.text(x + 0.01, curr_y, f"• {attr}", ha='left', va='center',
                    fontsize=7.5, color='#334155')
            curr_y -= 0.016

    # Draw Core Entities
    # Col 1: Facility & Master Tables
    draw_entity(0.04, 0.65, 0.17, 0.22, 'AIRPORTS', ['AIRPORT_CODE'], [], ['AIRPORT_NAME', 'CITY', 'COUNTRY', 'TIMEZONE', 'IS_ACTIVE'], 'MASTER')
    draw_entity(0.04, 0.38, 0.17, 0.21, 'AIRLINES', ['AIRLINE_CODE'], [], ['AIRLINE_NAME', 'THREE_DIGIT_CODE', 'COUNTRY', 'IS_ACTIVE'], 'MASTER')
    draw_entity(0.04, 0.10, 0.17, 0.23, 'GATES', ['GATE_ID'], ['AIRPORT_CODE'], ['TERMINAL', 'GATE_NUMBER', 'STATUS', 'IS_ACTIVE'], 'FACILITY')

    # Col 2: Fleet & Routes
    draw_entity(0.26, 0.65, 0.18, 0.23, 'FLIGHTS', ['FLIGHT_NUMBER'], ['AIRLINE_CODE', 'ORIGIN_AIRPORT', 'DEST_AIRPORT'], ['DEP_TIME', 'ARR_TIME', 'BASE_FARE'], 'TEMPLATE')
    draw_entity(0.26, 0.36, 0.18, 0.24, 'AIRCRAFT', ['AIRCRAFT_ID'], ['AIRLINE_CODE'], ['REGISTRATION_NO', 'MODEL', 'TOTAL_SEATS', 'STATUS'], 'FLEET')
    draw_entity(0.26, 0.08, 0.18, 0.23, 'EMPLOYEES', ['EMPLOYEE_ID'], ['USER_ID', 'AIRPORT_CODE', 'AIRLINE_CODE'], ['FIRST_NAME', 'LAST_NAME', 'JOB_TITLE'], 'HR / STAFF')

    # Col 3: Operations & Schedules
    draw_entity(0.49, 0.44, 0.20, 0.44, 'FLIGHT_INSTANCES', ['FLIGHT_INSTANCE_ID'], ['FLIGHT_NUMBER', 'AIRCRAFT_ID', 'DEP_GATE_ID', 'ARR_GATE_ID'], ['FLIGHT_DATE', 'SCHEDULED_DEP', 'ACTUAL_DEP', 'SCHEDULED_ARR', 'ACTUAL_ARR', 'STATUS', 'DELAY_MINS', 'REMARKS'], 'OPERATIONAL')
    draw_entity(0.49, 0.10, 0.20, 0.27, 'FLIGHT_STATUS_HISTORY', ['HISTORY_ID'], ['FLIGHT_INSTANCE_ID', 'CHANGED_BY_USER_ID'], ['OLD_STATUS', 'NEW_STATUS', 'REASON', 'CHANGED_AT'], 'AUDIT LOG')

    # Col 4: Users & Commercial Reservations
    draw_entity(0.74, 0.70, 0.22, 0.20, 'USERS', ['USER_ID'], [], ['EMAIL (UK)', 'PASSWORD_HASH', 'ROLE', 'IS_ACTIVE'], 'SECURITY')
    draw_entity(0.74, 0.43, 0.22, 0.22, 'BOOKINGS', ['BOOKING_ID'], ['USER_ID'], ['BOOKING_REF (PNR)', 'BOOKING_DATE', 'TOTAL_AMOUNT', 'STATUS'], 'TRANSACTIONS')
    draw_entity(0.74, 0.15, 0.22, 0.24, 'TICKETS', ['TICKET_ID'], ['BOOKING_ID', 'FLIGHT_INSTANCE_ID', 'PASSENGER_ID'], ['TICKET_NUMBER (UK)', 'SEAT_NUMBER', 'CABIN_CLASS', 'PRICE', 'STATUS'], 'E-TICKETS')

    # Relationship connectors (arrows & labels)
    def connect(x1, y1, x2, y2, label):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color="#2563EB", lw=1.5, ls="--"))
        mid_x = (x1 + x2) / 2
        mid_y = (y1 + y2) / 2
        ax.text(mid_x, mid_y, label, ha='center', va='center', fontsize=7,
                bbox=dict(boxstyle="round,pad=0.2", facecolor="#EFF6FF", edgecolor="#BFDBFE", lw=0.8),
                color="#1E40AF", fontweight='bold')

    connect(0.21, 0.76, 0.26, 0.76, '1 : N')
    connect(0.21, 0.48, 0.26, 0.48, '1 : N')
    connect(0.44, 0.76, 0.49, 0.76, '1 : N')
    connect(0.44, 0.48, 0.49, 0.54, '1 : N')
    connect(0.69, 0.54, 0.74, 0.25, '1 : N (Allocates)')
    connect(0.85, 0.43, 0.85, 0.39, '1 : N (Issues)')
    connect(0.85, 0.70, 0.85, 0.65, '1 : N')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'er_diagram.png'), dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print('Generated er_diagram.png')

# -------------------------------------------------------------
# 2. SYSTEM ARCHITECTURE DIAGRAM
# -------------------------------------------------------------
def generate_architecture_diagram():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    ax.axis('off')

    ax.text(0.5, 0.95, 'Airport Management System — 4-Tier Full-Stack Architecture',
            ha='center', va='top', fontsize=18, fontweight='bold', color='#102A43')
    ax.text(0.5, 0.91, 'Decoupled Client-Server Model with High-Performance RDBMS & Polyglot Engines',
            ha='center', va='top', fontsize=11, color='#64748B')

    tiers = [
        ('PRESENTATION TIER (UI / UX)', 0.05, 0.18, '#EFF6FF', '#1E40AF', [
            ('React.js 18 + Vite SPA', 'Lightning-fast client rendering & modular component lifecycle'),
            ('Role-Based Dashboards', 'Dedicated portals: Admin, Airline Staff, Airport Ops, Passenger'),
            ('Interactive Seat Map', 'Live visual cabin layout with seat availability & conflict locks'),
            ('Lucide Modern Icons', 'Ultra-clean modern aviation UI with zero cartoon aesthetics')
        ]),
        ('APPLICATION & API TIER', 0.28, 0.20, '#F0FDF4', '#166534', [
            ('Node.js & Express.js Engine', 'Non-blocking asynchronous RESTful API gateway on Port 5000'),
            ('RBAC & Auth Middleware', 'Signed JWT HttpOnly session protection & route-level guards'),
            ('ACID Transaction Controller', 'Atomic multi-table bookings, cancellations & boarding pass issuing'),
            ('Autonomous Event Monitors', 'Live triggers for flight status updates, delays & gate dispatch')
        ]),
        ('POLYGLOT INTEGRATION TIER', 0.53, 0.18, '#FEF3C7', '#92400E', [
            ('Native C Algorithm Engine', 'Greedy interval scheduling & Dijkstra baggage conveyor routing'),
            ('Java OOP Microservice', 'Polymorphic fare calculation via Strategy Pattern architecture'),
            ('IPC Integration Bridges', 'Direct synchronous binary execution via Node.js child processes'),
            ('Sub-Millisecond Execution', 'O(N log N) computational throughput for high-volume airport ops')
        ]),
        ('DATABASE PERSISTENCE TIER', 0.76, 0.19, '#F5F3FF', '#5B21B6', [
            ('Relational Database Engine', 'Oracle Database / MySQL 8.0 (airport_management_db)'),
            ('TCP/IP Connection Pool', 'High-concurrency pooled connections with auto-recycle safeguards'),
            ('Relational Invariants', 'Rigorous PK/FK referential integrity & composite unique constraints'),
            ('ACID Durability', 'Row-level locking (SELECT ... FOR UPDATE) for zero race conditions')
        ])
    ]

    for title, x, w, bg, text_color, items in tiers:
        # Card container
        box = patches.FancyBboxPatch((x, 0.10), w, 0.74, boxstyle="round,pad=0.01,rounding_size=0.012",
                                     facecolor=bg, edgecolor='#CBD5E1', linewidth=1.2)
        ax.add_patch(box)

        # Header
        hdr = patches.FancyBboxPatch((x, 0.78), w, 0.06, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor=text_color, edgecolor=text_color)
        ax.add_patch(hdr)
        ax.text(x + w/2, 0.81, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')

        # Items
        curr_y = 0.72
        for item_title, item_desc in items:
            ax.text(x + 0.015, curr_y, item_title, ha='left', va='top', fontsize=9, fontweight='bold', color=text_color)
            ax.text(x + 0.015, curr_y - 0.025, item_desc, ha='left', va='top', fontsize=7.5, color='#475569', wrap=True)
            curr_y -= 0.14

    # Flow arrows between tiers
    arrow_props = dict(arrowstyle="<->", color="#2563EB", lw=2, mutation_scale=15)
    ax.annotate('', xy=(0.28, 0.50), xytext=(0.23, 0.50), arrowprops=arrow_props)
    ax.text(0.255, 0.52, 'JSON / REST\nHttpOnly JWT', ha='center', va='bottom', fontsize=7.5, color='#1E40AF', fontweight='bold')

    ax.annotate('', xy=(0.53, 0.50), xytext=(0.48, 0.50), arrowprops=arrow_props)
    ax.text(0.505, 0.52, 'IPC / C-Node\nJava Process', ha='center', va='bottom', fontsize=7.5, color='#92400E', fontweight='bold')

    ax.annotate('', xy=(0.76, 0.50), xytext=(0.71, 0.50), arrowprops=arrow_props)
    ax.text(0.735, 0.52, 'SQL Pool\nACID Trans', ha='center', va='bottom', fontsize=7.5, color='#5B21B6', fontweight='bold')

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'architecture_diagram.png'), dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print('Generated architecture_diagram.png')

# -------------------------------------------------------------
# 3. WORKFLOW DIAGRAM: ACID RESERVATION & CHECK-IN
# -------------------------------------------------------------
def generate_workflow_diagram():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    ax.axis('off')

    ax.text(0.5, 0.95, 'Airport Operations — Transactional Ticket Reservation & Check-in Lifecycle',
            ha='center', va='top', fontsize=18, fontweight='bold', color='#102A43')
    ax.text(0.5, 0.91, 'Ensuring ACID Consistency, Row-Level Locks, and Real-Time Event Dispatch',
            ha='center', va='top', fontsize=11, color='#64748B')

    steps = [
        ('1. Flight Search & Seat Selection', 'Passenger queries active routes;\nvisual seat map inspects available\ninventory for target aircraft instance.', '#EFF6FF', '#1D4ED8'),
        ('2. Begin ACID Transaction', 'Express backend calls executeTransaction();\npulls dedicated connection from pool;\ninitializes atomic execution block.', '#F0FDF4', '#15803D'),
        ('3. Row-Level Seat Lock', 'SELECT ... FOR UPDATE locks requested seat;\nverifies seat is not allocated;\nblocks concurrent duplicate booking attempts.', '#FEF3C7', '#B45309'),
        ('4. Record Persistence', 'Inserts 6-char PNR into BOOKINGS;\ninserts e-ticket into TICKETS;\nupdates live aircraft available seat count.', '#EDE9FE', '#6D28D9'),
        ('5. Commit & Notification', 'ACID Commit writes permanently;\nreleases row locks; inserts in-app alert;\nsends confirmed payload back to React SPA.', '#ECFDF5', '#047857'),
        ('6. Web Check-in & Boarding Pass', 'Passenger confirms dangerous goods policy;\nallocates boarding gate; issues 2D barcode;\ngenerates digital demo boarding pass preview.', '#FFF1F2', '#BE123C')
    ]

    for idx, (title, desc, bg, border) in enumerate(steps):
        row = idx // 3
        col = idx % 3
        x = 0.06 + col * 0.31
        y = 0.50 if row == 0 else 0.12

        card = patches.FancyBboxPatch((x, y), 0.27, 0.30, boxstyle="round,pad=0.01,rounding_size=0.012",
                                      facecolor=bg, edgecolor=border, linewidth=1.5)
        ax.add_patch(card)

        # Number circle badge
        circle = patches.Circle((x + 0.025, y + 0.25), 0.018, facecolor=border, edgecolor='none')
        ax.add_patch(circle)
        ax.text(x + 0.025, y + 0.25, str(idx + 1), ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')

        ax.text(x + 0.05, y + 0.25, title[3:], ha='left', va='center', fontsize=10, fontweight='bold', color=border)
        ax.text(x + 0.02, y + 0.17, desc, ha='left', va='top', fontsize=8.5, color='#334155', linespacing=1.4)

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'workflow_diagram.png'), dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print('Generated workflow_diagram.png')

# -------------------------------------------------------------
# 4. NORMALIZATION DECOMPOSITION DIAGRAM
# -------------------------------------------------------------
def generate_normalization_diagram():
    fig, ax = plt.subplots(figsize=(16, 9), dpi=300)
    fig.patch.set_facecolor('#F8FAFC')
    ax.set_facecolor('#F8FAFC')
    ax.axis('off')

    ax.text(0.5, 0.95, 'Relational Database Normalization: 1NF → 2NF → 3NF Defense',
            ha='center', va='top', fontsize=18, fontweight='bold', color='#102A43')
    ax.text(0.5, 0.91, 'Elimination of Update, Insertion, and Deletion Anomalies Across Flight Records',
            ha='center', va='top', fontsize=11, color='#64748B')

    stages = [
        ('UNNORMALIZED / 1NF VIOLATION', 0.05, 0.28, '#FEE2E2', '#991B1B', [
            ('Flaw: Multi-Valued Attributes', 'Storig concatenated seats "12A, 14B" or comma-separated passengers in one column.'),
            ('Flaw: Repeating Groups', 'Columns like Passenger1, Passenger2, Passenger3 in a single booking record.'),
            ('1NF Resolution Applied', 'Enforced atomic values for every column; decomposed tickets into distinct relational rows.')
        ]),
        ('2NF VIOLATION & DECOMPOSITION', 0.36, 0.28, '#FEF3C7', '#92400E', [
            ('Flaw: Partial Dependency', 'Composite key (FLIGHT_NUMBER, FLIGHT_DATE) with route details depending only on Flight Number.'),
            ('Anomaly: Redundant Routes', 'Origin, destination, and base fare repeated for every daily flight occurrence.'),
            ('2NF Resolution Applied', 'Decomposed into FLIGHTS (template timetable) and FLIGHT_INSTANCES (daily occurrences).')
        ]),
        ('3NF VIOLATION & DECOMPOSITION', 0.67, 0.28, '#ECFDF5', '#065F46', [
            ('Flaw: Transitive Dependency', 'Non-key attribute depending on another non-key attribute (e.g. AIRCRAFT_ID → TOTAL_SEATS in Tickets).'),
            ('Anomaly: Update Inconsistency', 'Changing aircraft seating capacity requires updating thousands of passenger ticket records.'),
            ('3NF Resolution Applied', 'Separated AIRCRAFT, AIRPORTS, and AIRLINES into dedicated tables linked strictly by foreign keys.')
        ])
    ]

    for title, x, w, bg, text_color, items in stages:
        box = patches.FancyBboxPatch((x, 0.12), w, 0.72, boxstyle="round,pad=0.01,rounding_size=0.012",
                                     facecolor=bg, edgecolor=text_color, linewidth=1.5)
        ax.add_patch(box)

        hdr = patches.FancyBboxPatch((x, 0.76), w, 0.06, boxstyle="round,pad=0.005,rounding_size=0.008",
                                     facecolor=text_color, edgecolor=text_color)
        ax.add_patch(hdr)
        ax.text(x + w/2, 0.79, title, ha='center', va='center', fontsize=9.5, fontweight='bold', color='#FFFFFF')

        curr_y = 0.70
        for item_title, item_desc in items:
            ax.text(x + 0.015, curr_y, item_title, ha='left', va='top', fontsize=9.5, fontweight='bold', color=text_color)
            ax.text(x + 0.015, curr_y - 0.035, item_desc, ha='left', va='top', fontsize=8.5, color='#334155', wrap=True)
            curr_y -= 0.18

    plt.tight_layout()
    plt.savefig(os.path.join(OUTPUT_DIR, 'normalization_diagram.png'), dpi=300, facecolor=fig.get_facecolor(), bbox_inches='tight')
    plt.close()
    print('Generated normalization_diagram.png')

if __name__ == '__main__':
    generate_er_diagram()
    generate_architecture_diagram()
    generate_workflow_diagram()
    generate_normalization_diagram()
    print('All diagrams generated successfully.')
