import { expect, test } from "bun:test";

import {
  GeoJsonLineStringZMSchema,
  IsoTimestampSchema,
  OfflineSearchResultSchema,
  Position2DSchema,
  TrailSchema,
  TrailSummarySchema,
  TrailWithWaypointsSchema,
  WaypointSchema,
} from "..";

const timestamp = "2026-11-25T08:30:00+05:45";
const geometry = {
  type: "LineString",
  coordinates: [[83.70, 28.39, 2860, 0], [83.69, 28.40, 3210, 1200.5]],
};
const trail = {
  id: "poon-hill-loop",
  title: " Poon Hill Loop ",
  slug: "poon-hill-loop",
  region: "Annapurna",
  difficulty: "moderate",
  distanceKm: 9.5,
  elevationGainM: 350,
  maxAltitudeM: 3210,
  geom: geometry,
  status: "verified",
  createdBy: "mapper-1",
  createdAt: timestamp,
  updatedAt: timestamp,
};
const waypoint = {
  id: "poon-hill-viewpoint",
  name: " Poon Hill ",
  category: "viewpoint",
  geom: { type: "Point", coordinates: [83.69, 28.40, 3210] },
  altitudeM: 3210,
  createdAt: timestamp,
  updatedAt: timestamp,
};

test.each([
  ["the lower coordinate bounds", [-180, -90]],
  ["the upper coordinate bounds", [180, 90]],
  ["a longitude that would be invalid as latitude", [140, 85]],
])("accepts %s in GeoJSON order", (_label, position) => {
  expect(Position2DSchema.parse(position)).toEqual(position);
});

test.each([
  ["swapped axes near the antimeridian", [85, 140]],
  ["longitude outside the world", [180.01, 0]],
  ["altitude in a 2D tuple", [83, 28, 3000]],
  ["string longitude", ["83", 28]],
])("rejects 2D coordinates with %s", (_label, position) => {
  expect(Position2DSchema.safeParse(position).success).toBe(false);
});

test.each([
  ["one vertex", [geometry.coordinates[0]]],
  ["missing measure", [[83.70, 28.39, 2860], geometry.coordinates[1]]],
  ["negative measure", [[83.70, 28.39, 2860, -1], geometry.coordinates[1]]],
  ["out of range elevation", [[83.70, 28.39, 9001, 0], geometry.coordinates[1]]],
])("rejects a LineStringZM with %s", (_label, coordinates) => {
  expect(GeoJsonLineStringZMSchema.safeParse({ type: "LineString", coordinates }).success).toBe(false);
});

test("accepts Nepal's UTC offset and rejects a timestamp without a timezone", () => {
  expect(IsoTimestampSchema.parse(timestamp)).toBe(timestamp);
  expect(IsoTimestampSchema.safeParse("2026-11-25T08:30:00").success).toBe(false);
});

test("parses a verified trail with trimmed text and missing optional metadata", () => {
  expect(TrailSchema.parse(trail)).toEqual({
    ...trail,
    title: "Poon Hill Loop",
    description: null,
    elevationLossM: null,
    minAltitudeM: null,
    bbox: null,
    packRegionId: null,
  });
});

test.each([
  ["a blank slug", { slug: " " }],
  ["negative distance", { distanceKm: -0.01 }],
  ["fractional elevation gain", { elevationGainM: 0.5 }],
  ["unknown moderation state", { status: "published" }],
])("rejects a trail with %s", (_label, overrides) => {
  expect(TrailSchema.safeParse({ ...trail, ...overrides }).success).toBe(false);
});

test("projects a trail into a summary without carrying its geometry", () => {
  const summary = TrailSummarySchema.parse(trail);
  expect(summary).not.toHaveProperty("geom");
  expect(summary).toMatchObject({ id: trail.id, title: "Poon Hill Loop", status: "verified" });
  expect(TrailSummarySchema.parse(summary)).toEqual(summary);
  expect(TrailSchema.safeParse(summary).success).toBe(false);
});

test("parses embedded waypoints and rejects a waypoint without 3D geometry", () => {
  const parsed = TrailWithWaypointsSchema.parse({ ...trail, waypoints: [waypoint] });
  expect(parsed.waypoints).toEqual([{
    ...waypoint,
    name: "Poon Hill",
    trailId: null,
    region: null,
    description: null,
    photoUrls: [],
  }]);
  const flatWaypoint = { ...waypoint, geom: { type: "Point", coordinates: [83.69, 28.40] } };
  expect(WaypointSchema.safeParse(flatWaypoint).success).toBe(false);
  expect(TrailWithWaypointsSchema.safeParse({ ...trail, waypoints: [flatWaypoint] }).success).toBe(false);
});

test("accepts a minimal waypoint search hit with null trail metadata", () => {
  const hit = {
    id: waypoint.id, kind: "waypoint", title: "Poon Hill", latitude: 28.40, longitude: 83.69,
  };
  expect(OfflineSearchResultSchema.parse(hit)).toMatchObject({
    ...hit, trailId: null, score: null, difficulty: null,
  });
  expect(OfflineSearchResultSchema.safeParse({ ...hit, kind: "pack" }).success).toBe(false);
});
