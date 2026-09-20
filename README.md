# COURIERX — Courier & Parcel Delivery Tracking System

> **"Delivering trust, one parcel at a time."**

COURIERX is a modern, production-grade, full-stack logistics and courier management platform built using **Node.js, Express.js, EJS templating, and MongoDB with Mongoose ODM**. Designed to emulate enterprise-grade supply chain SaaS platforms, it implements real session-based role authorization, strict finite state machine parcel lifecycles, tamper-evident checkpoint audit history, dynamic regional delivery pricing, and an intentional dual-theme design system (**Warm Buttery Cream Light Mode** & **Deep Navy Dark Mode**).

---

## Table of Contents
1. [Project Overview & Key Features](#project-overview--key-features)
2. [Tech Stack](#tech-stack)
3. [Architecture (MVC)](#architecture-mvc)
4. [File & Directory Structure](#file--directory-structure)
5. [Database Models & Relationships](#database-models--relationships)
6. [User Roles & Access Control](#user-roles--access-control)
7. [Parcel Lifecycle & State Machine](#parcel-lifecycle--state-machine)
8. [Dynamic Delivery Charge Calculation](#dynamic-delivery-charge-calculation)
9. [Theme System (Light Buttery Cream & Dark Navy)](#theme-system)
10. [Installation & Setup](#installation--setup)
11. [Sample Credentials for Viva Demonstration](#sample-credentials-for-viva-demonstration)
12. [College Viva Q&A Guide](#college-viva-qa-guide)

---

## Project Overview & Key Features

COURIERX manages the complete real-world lifecycle of courier parcels from booking to final-mile delivery:
- **Public Parcel Tracking**: Anyone can track a shipment in real-time by entering a unique tracking ID (`CRX-XXXXXX`). A visual timeline shows each historical checkpoint (timestamps, hub locations, operator notes, and failure exceptions).
- **Customer Portal**: Multi-section shipment booking (Sender, Receiver, Parcel Dimensions, Pickup/Drop Pincodes) with live price estimation via AJAX and personal shipment history.
- **Admin Dispatch Center**: Real-time business metrics, live Chart.js visual analytics (Parcel Status Breakdown, 7-Day Bookings, Agent Workload), field courier fleet management, and delivery zone configuration.
- **Delivery Agent Portal**: Scoped to the individual agent’s assigned parcels, with strict state machine transitions (`PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED` with mandatory reason logging).
- **Theme System**: Universal Light Mode (warm buttery cream `#FFFBEA`, cards `#FFFDF3`, dark text) and Dark Mode (deep navy `#071426`, ocean cards `#10243B`, light text) with `localStorage` persistence and Chart.js color synchronization.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend Runtime** | Node.js | Fast, asynchronous JavaScript runtime |
| **Server Framework** | Express.js | Robust MVC routing, middleware, and request handling |
| **Database** | MongoDB | Document-oriented NoSQL database |
| **Object Modeling** | Mongoose | Strict schema definitions, hooks, validations, and indexes |
| **View Engine** | EJS (Embedded JavaScript) | Dynamic HTML server-side rendering with reusable partials |
| **Session & Auth** | `express-session` + `connect-mongo` | Secure cookie-based server sessions stored in MongoDB |
| **Security & Hashing**| `bcrypt` | Salted 10-round password hashing |
| **Styling & Design** | Vanilla CSS3 (Custom Properties) | Dual theme engine, responsive grid/flexbox, zero heavy frameworks |
| **Visual Charts** | Chart.js (CDN) | Theme-responsive Doughnut, Bar, and Horizontal Load charts |

*No React, Next.js, TypeScript, Tailwind, or Firebase are used, ensuring the codebase remains 100% beginner-readable and maintainable for academic vivas.*

---

## Architecture (MVC)

The project adheres strictly to the **Model-View-Controller (MVC)** architectural pattern:

```
                  ┌───────────────────────────────┐
                  │       Browser / Client        │
                  └──────────────┬────────────────┘
                                 │ HTTP Request
                                 ▼
                  ┌───────────────────────────────┐
                  │           app.js              │
                  │  (Sessions, Body Parsers,     │
                  │   Cookie, Theme Static Files) │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │       Routes Layer            │
                  │  /customer, /agent, /admin,   │
                  │  /login, /register, /track    │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │      Middleware Layer         │
                  │ requireAuth, requireRole(...) │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │      Controllers Layer        │
                  │  Business Logic, Charges,     │
                  │  Status Validation, Dispatch  │
                  └──────┬─────────────────┬──────┘
                         │                 │
              Data Flow  ▼                 ▼ Render View
                  ┌──────────────┐   ┌───────────────────────┐
                  │    Models    │   │      Views (EJS)      │
                  │  (Mongoose)  │   │  Partials, Dashboards │
                  └──────┬───────┘   │  Timelines, Cards     │
                         │           └───────────────────────┘
                         ▼
                  ┌──────────────┐
                  │   MongoDB    │
                  └──────────────┘
```

Startup separation:
- `server.js`: Loads environment variables, establishes MongoDB connection, and binds HTTP listener on `PORT 5000`.
- `app.js`: Configures Express middleware, template engine, session store, routes, and error handlers.

---

## File & Directory Structure

```
courier-tracking-system/
├── server.js                         # Database bootstrap & HTTP server listener
├── app.js                            # Express app configuration & middleware
├── package.json                      # NPM scripts and dependencies
├── .env                              # Environment variables (PORT, MONGO_URI, SESSION_SECRET)
├── .gitignore                        # Git exclusion rules
├── README.md                         # Complete project documentation & viva guide
│
├── config/
│   └── db.js                         # Mongoose connection with error handling
│
├── models/
│   ├── User.js                       # User schema with bcrypt pre-save hashing & roles
│   ├── Parcel.js                     # Parcel shipment details, pricing, and agent refs
│   ├── StatusHistory.js              # Immutable audit trail of checkpoint transitions
│   └── DeliveryZone.js               # Coverage zones with mapped pincodes & multipliers
│
├── controllers/
│   ├── authController.js             # Authentication, session setup, role redirection
│   ├── customerController.js         # Customer dashboard, parcel booking, parcel history
│   ├── agentController.js            # Agent assigned deliveries & status updates
│   └── adminController.js            # Admin analytics, dispatches, agent & zone management
│
├── routes/
│   ├── authRoutes.js                 # /login, /register, /logout
│   ├── customerRoutes.js             # /customer/* routes protected by CUSTOMER role
│   ├── agentRoutes.js                # /agent/* routes protected by AGENT role
│   ├── adminRoutes.js                # /admin/* routes protected by ADMIN role
│   └── trackingRoutes.js             # Public landing page (/) and public /track
│
├── middleware/
│   ├── auth.js                       # requireAuth session guard & guestOnly redirect
│   ├── role.js                       # requireRole(...roles) authorization guard
│   └── errorHandler.js               # Centralized 404 and global 500 exception handler
│
├── utils/
│   ├── generateTrackingId.js         # Unique CRX-XXXXXX tracking ID generator
│   ├── calculateCharge.js            # Tiered weight pricing × delivery zone multiplier
│   └── statusFlow.js                 # Strict state transitions & permitted next statuses
│
├── views/
│   ├── partials/
│   │   ├── navbar.ejs                # Dynamic role-based navigation & theme switcher
│   │   ├── sidebar.ejs               # Dashboard sidebar for Customer, Agent, and Admin
│   │   ├── footer.ejs                # Footer with links and viva documentation
│   │   └── alerts.ejs                # Flash/session alerts for errors & success
│   ├── auth/
│   │   ├── login.ejs                 # Login form with 1-click viva demo credential buttons
│   │   └── register.ejs              # Registration form (Customer & Agent roles)
│   ├── customer/
│   │   ├── dashboard.ejs             # Stats counters and recent shipments
│   │   ├── book-parcel.ejs           # Multi-section booking form with live price preview
│   │   ├── parcels.ejs               # Full shipment list with status filters
│   │   └── parcel-details.ejs        # Shipment invoice & visual audit timeline
│   ├── agent/
│   │   ├── dashboard.ejs             # Agent delivery metrics & pending action queue
│   │   ├── assigned-parcels.ejs      # Agent's assigned shipments
│   │   └── parcel-details.ejs        # State update form with mandatory failure reasons
│   ├── admin/
│   │   ├── dashboard.ejs             # Master KPIs + 3 Chart.js graphs
│   │   ├── parcels.ejs               # Searchable & filterable parcel manifest
│   │   ├── assign-parcel.ejs         # Assign active courier to unassigned parcel
│   │   ├── agents.ejs                # Delivery agents table with active toggle
│   │   ├── add-agent.ejs             # Form to provision new delivery agent
│   │   └── zones.ejs                 # Coverage zones & pincode tariff setup
│   ├── tracking/
│   │   └── track.ejs                 # Public tracking page with visual connected timeline
│   ├── home.ejs                      # Modern landing page with live database statistics
│   ├── 404.ejs                       # Themed 404 Not Found error page
│   └── error.ejs                     # Centralized graceful error page
│
├── public/
│   ├── css/
│   │   ├── style.css                 # Theme variables (Light Cream & Navy Dark), resets
│   │   ├── auth.css                  # Split-card styling & demo credential pills
│   │   ├── dashboard.css             # Sidebars, data tables, badges, timelines
│   │   └── responsive.css            # Tablet and mobile viewport breakpoints
│   ├── js/
│   │   ├── main.js                   # Universal theme toggle, alerts, mobile drawer
│   │   ├── tracking.js               # Tracking ID formatting and clipboard copier
│   │   ├── dashboard.js              # Live charge AJAX calculator & failure toggling
│   │   └── charts.js                 # Theme-aware Chart.js initialization
│   └── images/
│       └── logo.svg                  # Vector brand logo mark
│
└── seed/
    └── seedAdmin.js                  # Database seed script for immediate testing
```

---

## Database Models & Relationships

1. **`User`**:
   - `name`, `email` (unique, lowercase), `phone`, `password` (hashed), `role` (`CUSTOMER`, `AGENT`, `ADMIN`), `vehicleNumber`, `zone`, `isActive`.
2. **`Parcel`**:
   - `trackingId` (unique `CRX-XXXXXX`), `customerId` (ref `User`), `agentId` (ref `User`, null if unassigned),
   - `senderName`, `senderPhone`, `senderAddress`, `senderPincode`,
   - `receiverName`, `receiverPhone`, `receiverAddress`, `receiverPincode`,
   - `weight`, `parcelType` (`Document`, `Package`, `Fragile`, `Electronics`, `Other`), `description`,
   - `pickupAddress`, `pickupPincode`, `dropAddress`, `dropPincode`,
   - `estimatedCharge`, `zoneMultiplier`,
   - `status` (`BOOKED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED`),
   - `failureReason` (`Customer unavailable`, `Wrong address`, `Receiver refused`, `Address inaccessible`, `Other`).
3. **`StatusHistory`**:
   - `parcelId` (ref `Parcel`), `status`, `location`, `remarks`, `updatedBy` (ref `User`), `timestamp`.
4. **`DeliveryZone`**:
   - `name`, `pincodes` (array of postal code strings), `baseMultiplier` (1.0 to 1.5), `isActive`.

---

## User Roles & Access Control

| Role | Access URL Scope | Permitted Actions |
|---|---|---|
| **Public** | `/`, `/track`, `/login`, `/register` | View landing page, track any parcel with `CRX-XXXXXX`, register as Customer or Agent. |
| **CUSTOMER** | `/customer/*` | View dashboard, book parcels with live tariff calculations, view personal parcel log, inspect tracking timelines. |
| **AGENT** | `/agent/*` | View personal assigned deliveries, execute next-permitted status transitions, enter transit checkpoints, log failed deliveries. |
| **ADMIN** | `/admin/*` | View master analytics and 3 Chart.js graphs, assign couriers to shipments, provision/deactivate agents, configure delivery zones. |

---

## Parcel Lifecycle & State Machine

Status progression follows a strict mathematical finite state machine enforced in `utils/statusFlow.js`:

```
 [ BOOKED ]
     │
     ▼ (Agent assigned & collected)
 [ PICKED_UP ]
     │
     ▼ (Arrived at sorting hub)
 [ IN_TRANSIT ]
     │
     ▼ (Dispatched on delivery van)
 [ OUT_FOR_DELIVERY ]
     │
     ├───────────────────────────────┐
     │ (Handover success)            │ (Delivery exception)
     ▼                               ▼
[ DELIVERED ] (Terminal)       [ FAILED ] (Terminal, Reason required)
```

Illegal transitions (e.g. `BOOKED` ➔ `DELIVERED`, `DELIVERED` ➔ `IN_TRANSIT`, or `FAILED` ➔ `DELIVERED`) are strictly prevented both at the UI dropdown level and validated in the backend controller.

---

## Dynamic Delivery Charge Calculation

Implemented in `utils/calculateCharge.js`:

### 1. Base Weight Tiers
- **0–1 kg**: ₹50
- **1–3 kg**: ₹80
- **3–5 kg**: ₹120
- **5+ kg**: ₹160 (plus ₹20 per extra kg above 5)

### 2. Regional Zone Multiplier
- **Local (Same Zone / Intra-city)**: `1.0x`
- **Nearby (Inter-Zone Metro Network)**: `1.25x`
- **Regional / Inter-State**: `1.5x`

### 3. Formula
$$\text{Estimated Charge} = \text{round}(\text{Base Weight Rate} \times \text{Zone Multiplier})$$

*Clearly marked as an "Estimated Delivery Charge" throughout the booking interface and invoices.*

---

## Theme System

Designed intentionally without color inversion:
- **Light Mode (Default)**:
  - Background: Warm Cream (`#FFFBEA`)
  - Accent / Buttons: Buttery Yellow (`#F4D35E`, dark text `#1C1917`)
  - Cards: Soft Ivory (`#FFFDF3`)
  - Borders: Soft warm gray/yellow (`#EBDFA9`)
  - Typography: Dark Charcoal (`#252525`)
- **Dark Mode**:
  - Background: Deep Navy (`#071426`)
  - Secondary: Midnight Blue (`#0D1B2A`)
  - Accent / Buttons: Royal Blue (`#2563EB`, white text)
  - Cards: Deep Ocean Card (`#10243B`)
  - Borders: Muted Steel (`#1E3A5F`)
  - Typography: Soft Ice White (`#F8FAFC`)
- **Persistence**: Saved in `localStorage.getItem('theme')`. An inline `<head>` script sets `data-theme` immediately before HTML parsing to eliminate theme flickering.
- **Chart.js**: Graph gridlines and label typography dynamically adapt to light/dark themes.

---

## Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (installed and running locally on port 27017 or a MongoDB Atlas URI)

### Steps

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**:
   Ensure `.env` exists in the project root:
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/courierx
   SESSION_SECRET=courierx_super_secret_session_key_2026
   NODE_ENV=development
   ```

   > [!NOTE]
   > On macOS, Apple's built-in **AirPlay Receiver** reserves port `5000` by default. To avoid port collision (`EADDRINUSE` or `403 Forbidden` from macOS ControlCenter), CourierX uses port `5001` with automated conflict fallback built into `server.js`.

3. **Seed Database with Sample Data**:
   Populates the database with 1 Admin, 2 Agents, 3 Customers, 5 Delivery Zones, and 5 Sample Parcels with full checkpoint timelines:
   ```bash
   npm run seed
   ```

4. **Start the Application**:
   Development mode with auto-reload:
   ```bash
   npm run dev
   ```
   Or standard start:
   ```bash
   npm start
   ```

5. **Open in Browser**:
   Visit [http://localhost:5001](http://localhost:5001) or [http://127.0.0.1:5001](http://127.0.0.1:5001)

---

## Sample Credentials for Viva Demonstration

The seed script (`npm run seed`) automatically creates the following test accounts:

### 👑 Administrator
- **Email**: `admin@courierx.com`
- **Password**: `Admin@123`
- *Features to show*: Dashboard with 3 Chart.js graphs, assign unassigned parcels to couriers, add new couriers, toggle courier active/inactive, configure delivery zones.

### 🚚 Delivery Agents
- **Agent 1 (Delhi Central)**:
  - **Email**: `agent.vikram@courierx.com`
  - **Password**: `Agent@123`
- **Agent 2 (Noida / Greater Noida)**:
  - **Email**: `agent.rahul@courierx.com`
  - **Password**: `Agent@123`
- *Features to show*: Assigned parcels queue, update status with valid next states, enter location & remarks, select failure reasons when marking failed.

### 👤 Customers
- **Customer 1**: `customer1@gmail.com` / `Customer@123`
- **Customer 2**: `customer2@gmail.com` / `Customer@123`
- **Customer 3**: `customer3@gmail.com` / `Customer@123`
- *Features to show*: Book new parcel with live charge estimation, view my parcels, inspect detailed invoice & visual timeline.

### 📦 Sample Tracking IDs (Test at `/track` without logging in)
- `CRX-8F4K29` — **BOOKED** (Unassigned)
- `CRX-4A72B9` — **IN_TRANSIT** (Assigned to Vikram Singh)
- `CRX-99K2L1` — **OUT_FOR_DELIVERY** (Assigned to Rahul Sharma)
- `CRX-33M8X7` — **DELIVERED** (Handover confirmed)
- `CRX-77F1D4` — **FAILED** (Reason: Customer unavailable)

*(Note: The login page also features 1-click demo credential fill buttons for fast presentation during a viva!)*

---

## College Viva Q&A Guide

When asked about the architectural and technical choices in this project, you can explain:

1. **Why MVC Architecture?**
   - *Model*: Defines Mongoose schemas (`User`, `Parcel`, `StatusHistory`, `DeliveryZone`) ensuring data integrity and validation before database persistence.
   - *View*: EJS files that render clean HTML server-side with zero heavy frontend framework bloat.
   - *Controller*: Keeps routes thin by handling input sanitization, price calculation, status machine validation, and database operations in dedicated controller files.

2. **How does Authentication work?**
   - Passwords are encrypted using **bcrypt** with 10 salt rounds before being saved in MongoDB.
   - Sessions are managed with **express-session** and stored in the database using **connect-mongo**. This means even if the Node server restarts, logged-in sessions are preserved.
   - Role-based middleware (`requireRole('ADMIN')`, `requireRole('AGENT')`, `requireRole('CUSTOMER')`) guards sensitive endpoints so users cannot access unauthorized pages by typing the URL manually.

3. **How does the Tracking Timeline work?**
   - Rather than just storing a single string for status on the parcel, every state change creates a new record in the `StatusHistory` collection.
   - This records the exact timestamp, GPS/hub location, remarks, and user ID of whoever performed the action, creating an immutable audit trail.

4. **How does the Delivery Charge Calculation work?**
   - The system checks the parcel weight tier (0-1kg = ₹50, 1-3kg = ₹80, 3-5kg = ₹120, 5kg+ = ₹160 + ₹20/kg).
   - It checks the sender and receiver pincodes against registered `DeliveryZone` documents to calculate the regional multiplier (1.0x, 1.25x, 1.5x) and produces an estimated price.

5. **How does the Light & Dark theme work?**
   - Built with CSS Custom Properties (`--bg-primary`, `--text-primary`, `--accent-primary`, etc.).
   - The selected theme is stored in `localStorage` and read synchronously in the document `<head>` to prevent the screen from flashing between themes upon page reload.
# Courier-Parcel-Delivery-System
