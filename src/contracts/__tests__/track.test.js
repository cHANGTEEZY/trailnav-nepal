import { expect, test } from "bun:test";

import {
  GpxTrackSchema,
  LiveTrackMetricsSchema,
  RecordedTrackSchema,
  TrackPointSchema,
  TrackSubmissionDraftSchema,
} from "..";

const timestamp = "2026-11-25T02:45:00Z";
const location = { latitude: 28.39, longitude: 83.70 };
const sample = {
  ...location,
  id: "sample-1",
  trackId: "track-1",
  sequence: 0,
  recordedAt: timestamp,
  timestampMs: Date.parse(timestamp),
};

test("accepts the first track point when sensor readings are unavailable", () => {
  expect(TrackPointSchema.parse(sample)).toEqual({
    ...sample,
    altitudeM: null,
    barometricAltitudeM: null,
    demAltitudeM: null,
    fusedAltitudeM: null,
    accuracyM: null,
    speedMps: null,
    headingDeg: null,
    pressureHpa: null,
    isFiltered: false,
  });
});

test("preserves zero-valued readings and distinct measured and fused altitudes", () => {
  const measurements = {
    altitudeM: 2860.2,
    barometricAltitudeM: 2863,
    demAltitudeM: 2857,
    fusedAltitudeM: 2861,
    accuracyM: 0,
    speedMps: 0,
    headingDeg: 360,
    pressureHpa: 725,
    isFiltered: true,
  };
  expect(TrackPointSchema.parse({ ...sample, ...measurements })).toMatchObject(measurements);
});

test.each([
  ["negative sequence", { sequence: -1 }],
  ["fractional epoch milliseconds", { timestampMs: 0.5 }],
  ["negative GPS accuracy", { accuracyM: -1 }],
  ["out of range heading", { headingDeg: 360.1 }],
  ["zero pressure", { pressureHpa: 0 }],
])("rejects a track point with %s", (_label, overrides) => {
  expect(TrackPointSchema.safeParse({ ...sample, ...overrides }).success).toBe(false);
});

test("accepts an unfinished local recording without geometry or an end time", () => {
  const recording = {
    id: sample.trackId,
    userId: "trekker-1",
    title: " Morning hike ",
    startedAt: timestamp,
    movingTimeSeconds: 0,
    elapsedTimeSeconds: 0,
    totalDistanceKm: 0,
    elevationGainM: 0,
    elevationLossM: 0,
    syncStatus: "local_only",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  expect(RecordedTrackSchema.parse(recording)).toMatchObject({
    title: "Morning hike", endedAt: null, geom: null, trailId: null, syncStatus: "local_only",
  });
  expect(RecordedTrackSchema.safeParse({ ...recording, elapsedTimeSeconds: -1 }).success).toBe(false);
  expect(RecordedTrackSchema.safeParse({ ...recording, syncStatus: "uploaded" }).success).toBe(false);
});

test("represents idle metrics with explicit missing readings and a drained battery", () => {
  const metrics = {
    trackId: null,
    status: "idle",
    distanceKm: 0,
    altitudeM: null,
    elevationGainM: 0,
    elevationLossM: 0,
    maxAltitudeM: null,
    movingTimeSeconds: 0,
    elapsedTimeSeconds: 0,
    currentPaceMinPerKm: null,
    currentSpeedKmh: null,
    accuracyM: null,
    pointCount: 0,
    isStationary: true,
    batteryLevel: 0,
    batterySaverEnabled: true,
    offTrailDistanceM: null,
    isOffTrail: false,
  };
  expect(LiveTrackMetricsSchema.parse(metrics)).toEqual(metrics);
  expect(LiveTrackMetricsSchema.safeParse({ ...metrics, batteryLevel: 1 }).success).toBe(true);
  expect(LiveTrackMetricsSchema.safeParse({ ...metrics, batteryLevel: 100 }).success).toBe(false);
});

test("keeps community submission opt-in and validates waypoint drafts", () => {
  const draft = { trackId: sample.trackId, title: " Morning hike ", region: " Annapurna ", difficulty: "easy" };
  expect(TrackSubmissionDraftSchema.parse(draft)).toEqual({
    ...draft, title: "Morning hike", region: "Annapurna", notes: null,
    waypoints: [], submitForCommunityReview: false,
  });
  const waypoint = { ...location, name: " Teahouse ", category: "teahouse", altitudeM: 2860 };
  expect(TrackSubmissionDraftSchema.parse({ ...draft, waypoints: [waypoint] }).waypoints).toEqual([
    { ...waypoint, name: "Teahouse", description: null, localPhotoUris: [] },
  ]);
  expect(TrackSubmissionDraftSchema.safeParse({
    ...draft, waypoints: [{ ...waypoint, latitude: 91 }],
  }).success).toBe(false);
});

test("imports a two-point GPX track with optional waypoint data and rejects one point", () => {
  const track = {
    name: " Morning hike ",
    points: [location, { latitude: 28.40, longitude: 83.69, elevationM: 3210, time: timestamp }],
  };
  expect(GpxTrackSchema.parse(track)).toEqual({
    name: "Morning hike",
    description: null,
    points: [{ ...location, elevationM: null, time: null }, track.points[1]],
    waypoints: [],
  });
  expect(GpxTrackSchema.parse({
    ...track, waypoints: [{ ...location, name: "Trailhead" }],
  }).waypoints).toEqual([
    { ...location, name: "Trailhead", description: null, elevationM: null, time: null, symbol: null },
  ]);
  expect(GpxTrackSchema.safeParse({ ...track, points: [location] }).success).toBe(false);
});
