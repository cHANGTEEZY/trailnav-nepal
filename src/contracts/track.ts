import { z } from "zod";

import {
  AltitudeMetersSchema,
  EntityIdSchema,
  GeoJsonLineStringZMSchema,
  IsoTimestampSchema,
  LatitudeSchema,
  LongitudeSchema,
  TrailDifficultySchema,
  WaypointCategorySchema,
} from "./trail";

export const SyncStatusSchema = z.enum(["synced", "local_only", "pending"]);
export type SyncStatus = z.infer<typeof SyncStatusSchema>;

export const RecordingStatusSchema = z.enum(["idle", "recording", "paused"]);
export type RecordingStatus = z.infer<typeof RecordingStatusSchema>;

export const TrackPointSchema = z.object({
  id: EntityIdSchema,
  trackId: EntityIdSchema,
  sequence: z.number().int().nonnegative(),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  altitudeM: AltitudeMetersSchema.nullable().default(null),
  barometricAltitudeM: AltitudeMetersSchema.nullable().default(null),
  demAltitudeM: AltitudeMetersSchema.nullable().default(null),
  fusedAltitudeM: AltitudeMetersSchema.nullable().default(null),
  accuracyM: z.number().nonnegative().nullable().default(null),
  speedMps: z.number().nonnegative().nullable().default(null),
  headingDeg: z.number().min(0).max(360).nullable().default(null),
  pressureHpa: z.number().positive().nullable().default(null),
  isFiltered: z.boolean().default(false),
  recordedAt: IsoTimestampSchema,
  timestampMs: z.number().int().nonnegative(),
});
export type TrackPoint = z.infer<typeof TrackPointSchema>;

export const RecordedTrackSchema = z.object({
  id: EntityIdSchema,
  userId: EntityIdSchema,
  trailId: EntityIdSchema.nullable().default(null),
  title: z.string().trim().min(1),
  notes: z.string().nullable().default(null),
  difficulty: TrailDifficultySchema.nullable().default(null),
  startedAt: IsoTimestampSchema,
  endedAt: IsoTimestampSchema.nullable().default(null),
  movingTimeSeconds: z.number().int().nonnegative(),
  elapsedTimeSeconds: z.number().int().nonnegative(),
  totalDistanceKm: z.number().nonnegative(),
  elevationGainM: z.number().int().nonnegative(),
  elevationLossM: z.number().int().nonnegative(),
  maxAltitudeM: z.number().int().nullable().default(null),
  minAltitudeM: z.number().int().nullable().default(null),
  geom: GeoJsonLineStringZMSchema.nullable().default(null),
  syncStatus: SyncStatusSchema,
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type RecordedTrack = z.infer<typeof RecordedTrackSchema>;

export const LiveTrackMetricsSchema = z.object({
  trackId: EntityIdSchema.nullable(),
  status: RecordingStatusSchema,
  distanceKm: z.number().nonnegative(),
  altitudeM: AltitudeMetersSchema.nullable(),
  elevationGainM: z.number().int().nonnegative(),
  elevationLossM: z.number().int().nonnegative(),
  maxAltitudeM: z.number().int().nullable(),
  movingTimeSeconds: z.number().int().nonnegative(),
  elapsedTimeSeconds: z.number().int().nonnegative(),
  currentPaceMinPerKm: z.number().nonnegative().nullable(),
  currentSpeedKmh: z.number().nonnegative().nullable(),
  accuracyM: z.number().nonnegative().nullable(),
  pointCount: z.number().int().nonnegative(),
  isStationary: z.boolean(),
  batteryLevel: z.number().min(0).max(1).nullable(),
  batterySaverEnabled: z.boolean(),
  offTrailDistanceM: z.number().nonnegative().nullable(),
  isOffTrail: z.boolean(),
});
export type LiveTrackMetrics = z.infer<typeof LiveTrackMetricsSchema>;

export const WaypointDraftSchema = z.object({
  name: z.string().trim().min(1),
  category: WaypointCategorySchema,
  description: z.string().nullable().default(null),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  altitudeM: z.number().int(),
  localPhotoUris: z.array(z.string().min(1)).default([]),
});
export type WaypointDraft = z.infer<typeof WaypointDraftSchema>;

export const TrackSubmissionDraftSchema = z.object({
  trackId: EntityIdSchema,
  title: z.string().trim().min(1),
  region: z.string().trim().min(1),
  difficulty: TrailDifficultySchema,
  notes: z.string().nullable().default(null),
  waypoints: z.array(WaypointDraftSchema).default([]),
  submitForCommunityReview: z.boolean().default(false),
});
export type TrackSubmissionDraft = z.infer<typeof TrackSubmissionDraftSchema>;

export const GpxWaypointSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().default(null),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  elevationM: AltitudeMetersSchema.nullable().default(null),
  time: IsoTimestampSchema.nullable().default(null),
  symbol: z.string().nullable().default(null),
});
export type GpxWaypoint = z.infer<typeof GpxWaypointSchema>;

export const GpxTrackPointSchema = z.object({
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  elevationM: AltitudeMetersSchema.nullable().default(null),
  time: IsoTimestampSchema.nullable().default(null),
});
export type GpxTrackPoint = z.infer<typeof GpxTrackPointSchema>;

export const GpxTrackSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().default(null),
  points: z.array(GpxTrackPointSchema).min(2),
  waypoints: z.array(GpxWaypointSchema).default([]),
});
export type GpxTrack = z.infer<typeof GpxTrackSchema>;
