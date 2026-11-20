# TrailNav Nepal — Engineering & Product Execution Plan

An offline-first trekking and trail navigation mobile app built for high-altitude, low-connectivity mountain terrain (Annapurna, Everest, Langtang, Manaslu, etc.).

---

## 1. System Architecture

                  ┌─────────────────────────────────────────┐
                  │          Expo React Native App          │
                  │  (MapLibre GL, expo-location, SQLite)   │
                  └───────────────┬─────────────────────────┘
                                  │ HTTPS / Sync Protocol
                                  ▼
                  ┌─────────────────────────────────────────┐
                  │             Hono REST API               │
                  │       (Auth, Sync, Route Engine)        │
                  └──────┬──────────────────────┬───────────┘
                         │                      │
                         ▼                      ▼
               ┌───────────────────┐  ┌───────────────────┐
               │ PostgreSQL/PostGIS│  │   Cloudflare R2   │
               │ (Spatial Data/DB) │  │  (Tiles & Photos) │
               └───────────────────┘  └───────────────────┘

### Client Stack (Mobile)

- **Framework:** React Native via Expo (Bare/Prebuild workflow for native background services).
- **Map Engine:** `@maplibre/maplibre-react-native` (vector tiles, offline cache support).
- **Location & Sensors:** `expo-location` (foreground + background location), `expo-sensors` (barometer/altimeter).
- **Local Storage:** `expo-sqlite` with Drizzle ORM or Kysely for local caching and offline sync queues.
- **Offline File Cache:** `expo-file-system` to store `.mbtiles` packages and downloaded GPX bundles.

### Backend Stack

- **API Runtime:** Hono on Bun or Node.js.
- **Database:** PostgreSQL with PostGIS extension for spatial queries (`ST_DWithin`, `ST_Simplify`, `ST_Distance`).
- **Object Storage:** Cloudflare R2 (cost-effective storage for offline regional vector tiles, GPX tracks, and user photo uploads).
- **Admin & Moderation Panel:** TanStack Start or Next.js dashboard for reviewing and approving community-submitted routes.

---

## 2. Core Technical Strategy

### A. Offline-First Map Delivery

1. **Regional Tile Packs:** Pre-render OpenStreetMap and OpenTopoMap data into compressed vector tile archives (`.mbtiles` or directory bundles) grouped by trekking zones (e.g., _Annapurna Circuit_, _Khumbu / EBC_, _Langtang Valley_).
2. **On-Demand Downloads:** Trekker downloads a single ~50–150MB regional pack before leaving Wi-Fi/cellular range.
3. **Local Tile Server / File Provider:** MapLibre loads style JSON pointing directly to local `file://` URIs.

### B. High-Altitude GPS & Elevation Smoothing

1. **GPS Jitter Mitigation:** Himalayan valleys cause severe GPS multipath reflections.
   - Filter out raw GPS points with accuracy worse than 15–20 meters.
   - Apply a Kalman Filter or moving average window over the last 5 coordinates.
   - Run the Ramer-Douglas-Peucker (RDP) algorithm on completed tracks to compress points without losing trail geometry.
2. **True Elevation Profiling:**
   - Phone GPS altitude can deviate by $\pm 50$ meters in steep gorges.
   - Combine device barometric pressure changes with offline digital elevation models (SRTM / Copernicus 30m DEM tiles queried locally).
   - Only accumulate elevation gain if upward delta exceeds a threshold ($> 3\,\text{m}$) over a rolling window.

### C. Battery Optimization Under Cold Conditions

- **Dynamic Sampling Intervals:** When stationary (detected via accelerometer), throttle GPS queries to once every 60 seconds; when moving, sample every 3–5 seconds.
- **Dark Mode Trail Display:** AMOLED screens save significant battery rendering dark topographic vectors.
- **Background Task Isolation:** Decouple GPS collection from UI rendering to avoid CPU wake locks.

---

## 3. Database Schema (PostGIS & SQLite)

### Core Tables

#### `trails`

- `id` (UUID, PK)
- `title` (VARCHAR)
- `slug` (VARCHAR, Unique)
- `region` (VARCHAR) — e.g., 'Solukhumbu', 'Annapurna'
- `difficulty` (ENUM: 'easy', 'moderate', 'hard', 'alpine')
- `distance_km` (FLOAT)
- `elevation_gain_m` (INT)
- `max_altitude_m` (INT)
- `geom` (GEOMETRY(LineStringZM, 4326)) — Lat, Lon, Elevation, Time/Distance
- `status` (ENUM: 'verified', 'community_pending', 'community_approved')
- `created_by` (UUID, FK -> users)

#### `waypoints` (POIs)

- `id` (UUID, PK)
- `trail_id` (UUID, FK -> trails)
- `category` (ENUM: 'viewpoint', 'teahouse', 'water_source', 'pass', 'monastery', 'hazard')
- `name` (VARCHAR)
- `description` (TEXT)
- `geom` (GEOMETRY(PointZ, 4326))
- `altitude_m` (INT)
- `photo_urls` (TEXT[])

#### `recorded_tracks`

- `id` (UUID, PK)
- `user_id` (UUID, FK -> users)
- `trail_id` (UUID, Nullable FK -> trails)
- `title` (VARCHAR)
- `started_at` (TIMESTAMPTZ)
- `ended_at` (TIMESTAMPTZ)
- `moving_time_seconds` (INT)
- `total_distance_km` (FLOAT)
- `elevation_gain_m` (INT)
- `elevation_loss_m` (INT)
- `geom` (GEOMETRY(LineStringZM, 4326))
- `sync_status` (VARCHAR: 'synced', 'local_only', 'pending')

#### `safety_reports`

- `id` (UUID, PK)
- `trail_id` (UUID, FK -> trails)
- `user_id` (UUID, FK -> users)
- `hazard_type` (ENUM: 'landslide', 'blocked_pass', 'wildlife', 'broken_bridge', 'snow_ice')
- `description` (TEXT)
- `geom` (GEOMETRY(Point, 4326))
- `created_at` (TIMESTAMPTZ)

---

## 4. Phased Implementation Roadmap

### Phase 1: Local Foundation & Map Engine (Weeks 1–3)

- [ ] Initialize Expo project with native directory (`npx expo run:ios` / `android`).
- [ ] Configure MapLibre React Native with offline caching capabilities.
- [ ] Package one sample region (e.g., Poon Hill / Ghorepani) into offline `.mbtiles`.
- [ ] Verify offline vector tile rendering and raster hillshade overlay with zero network connection.

### Phase 2: Live Tracking & Spatial Engine (Weeks 4–6)

- [ ] Implement background location tracker with `expo-location` task manager.
- [ ] Build local SQLite database with migrations for tracks and waypoints.
- [ ] Implement real-time tracking metrics:
  - Total distance (Haversine / Vincenty along valid points).
  - Elevation gain/loss with deadband noise filtering ($> 3\,\text{m}$).
  - Off-trail alerts (`ST_Distance` threshold alert if user drifts $> 60\,\text{m}$ from polyline).
- [ ] Battery testing at screen-off recording for 6+ continuous hours.

### Phase 3: Backend API, PostGIS & Cloud Sync (Weeks 7–8)

- [ ] Stand up Hono REST API with PostgreSQL/PostGIS.
- [ ] Build GPX/GeoJSON import/export utilities.
- [ ] Implement two-way sync protocol:
  - Local tracks queued in SQLite sync automatically upon reconnecting to network.
  - Image uploads pushed directly to Cloudflare R2 via signed URLs.

### Phase 4: Community Routes & Moderation Pipeline (Weeks 9–10)

- [ ] Route recording submission flow: user names route, tags waypoints, adds photos, flags difficulty.
- [ ] Admin verification dashboard:
  - Overlay proposed community line against satellite basemap & existing trails.
  - Inspect elevation profile spikes and dangerous cliffs.
  - One-click approve, reject, or edit trail geometry.
- [ ] Public badges: Verified Official Trail vs. Unverified Community Track (with safety disclaimer).

### Phase 5: Field Polish & Safety Features (Weeks 11–12)

- [ ] High-altitude safety features:
  - Ascent rate alert (warns if climbing $> 500\,\text{m}$/day above $3,000\,\text{m}$ to prevent AMS/Altitude Sickness).
  - Emergency SOS offline screen (displays exact GPS Lat/Lon coordinates in large text + bearing to nearest registered village/teahouse).
- [ ] Offline search for downloaded regions (find teahouses, water points, peaks by name).
