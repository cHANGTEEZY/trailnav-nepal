import { expect, test } from "bun:test";

import {
  AmsAlertSchema,
  CreateSafetyReportInputSchema,
  OffTrailAlertSchema,
  SafetyReportSchema,
  SosReadingSchema,
} from "..";

const timestamp = "2026-11-25T02:45:00Z";
const location = { latitude: 28.39, longitude: 83.70 };
const reportInput = {
  ...location,
  hazardType: "broken_bridge",
  description: " Missing planks ",
};

test("accepts an offline hazard draft without a trail or photos", () => {
  expect(CreateSafetyReportInputSchema.parse(reportInput)).toEqual({
    ...reportInput,
    description: "Missing planks",
    trailId: null,
    severity: "moderate",
    altitudeM: null,
    localPhotoUris: [],
  });
});

test.each([
  ["blank description", { description: " " }],
  ["unknown hazard", { hazardType: "other" }],
  ["out of range latitude", { latitude: 91 }],
  ["empty photo URI", { localPhotoUris: [""] }],
])("rejects a hazard draft with %s", (_label, overrides) => {
  expect(CreateSafetyReportInputSchema.safeParse({ ...reportInput, ...overrides }).success).toBe(false);
});

test("stores a hazard report as an unresolved local Point with separate altitude", () => {
  const report = {
    id: "hazard-1",
    userId: "trekker-1",
    hazardType: reportInput.hazardType,
    description: reportInput.description,
    geom: { type: "Point", coordinates: [location.longitude, location.latitude] },
    altitudeM: 2860,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  expect(SafetyReportSchema.parse(report)).toEqual({
    ...report, description: "Missing planks", severity: "moderate",
    trailId: null, photoUrls: [], syncStatus: "local_only", isResolved: false,
  });
  expect(SafetyReportSchema.safeParse({
    ...report, geom: { type: "Point", coordinates: [...report.geom.coordinates, report.altitudeM] },
  }).success).toBe(false);
});

test("documents default AMS thresholds and rejects a nonpositive threshold", () => {
  const alert = {
    level: "warning",
    currentAltitudeM: 3650,
    baselineAltitudeM: 3100,
    ascent24hM: 550,
    message: "Rapid ascent",
    evaluatedAt: timestamp,
  };
  expect(AmsAlertSchema.parse(alert)).toEqual({ ...alert, thresholdM: 500, altitudeFloorM: 3000 });
  expect(AmsAlertSchema.safeParse({ ...alert, thresholdM: 0 }).success).toBe(false);
});

test("accepts an on-trail fix at zero distance and rejects invalid distance or bearing", () => {
  const evaluation = {
    isOffTrail: false,
    distanceFromTrailM: 0,
    nearestPoint: [location.longitude, location.latitude],
    bearingToTrailDeg: 0,
    evaluatedAt: timestamp,
  };
  expect(OffTrailAlertSchema.parse(evaluation)).toEqual({ ...evaluation, thresholdM: 60 });
  expect(OffTrailAlertSchema.safeParse({ ...evaluation, distanceFromTrailM: -1 }).success).toBe(false);
  expect(OffTrailAlertSchema.safeParse({ ...evaluation, bearingToTrailDeg: 361 }).success).toBe(false);
});

test("supports an SOS reading without sensor or shelter data and checks nested shelter bearings", () => {
  const reading = {
    ...location,
    formattedDD: "28.39° N, 83.70° E",
    formattedDMS: "28°23′24″ N, 83°42′00″ E",
    altitudeM: null,
    accuracyM: null,
    deviceHeadingDeg: null,
    nearestShelter: null,
    capturedAt: timestamp,
  };
  expect(SosReadingSchema.parse(reading)).toEqual(reading);

  const shelter = {
    latitude: 28.40,
    longitude: 83.69,
    waypointId: "shelter-1",
    name: "Ghorepani teahouse",
    category: "teahouse",
    distanceM: 1480,
    bearingDeg: 318,
    cardinalDirection: "NW",
    altitudeM: 2860,
  };
  expect(SosReadingSchema.parse({ ...reading, nearestShelter: shelter }).nearestShelter).toEqual(shelter);
  expect(SosReadingSchema.safeParse({
    ...reading, nearestShelter: { ...shelter, cardinalDirection: "WNW" },
  }).success).toBe(false);
});
