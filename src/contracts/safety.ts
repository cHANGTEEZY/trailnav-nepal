import { z } from "zod";

import {
  AltitudeMetersSchema,
  EntityIdSchema,
  GeoJsonPointSchema,
  IsoTimestampSchema,
  LatitudeSchema,
  LongitudeSchema,
  Position2DSchema,
  WaypointCategorySchema,
} from "./trail";
import { SyncStatusSchema } from "./track";

export const HazardTypeSchema = z.enum([
  "landslide",
  "blocked_pass",
  "wildlife",
  "broken_bridge",
  "snow_ice",
]);
export type HazardType = z.infer<typeof HazardTypeSchema>;

export const HazardSeveritySchema = z.enum([
  "low",
  "moderate",
  "high",
  "critical",
]);
export type HazardSeverity = z.infer<typeof HazardSeveritySchema>;

export const SafetyReportSchema = z.object({
  id: EntityIdSchema,
  trailId: EntityIdSchema.nullable().default(null),
  userId: EntityIdSchema,
  hazardType: HazardTypeSchema,
  severity: HazardSeveritySchema.default("moderate"),
  description: z.string().trim().min(1),
  geom: GeoJsonPointSchema,
  altitudeM: z.number().int().nullable().default(null),
  photoUrls: z.array(z.string().min(1)).default([]),
  syncStatus: SyncStatusSchema.default("local_only"),
  isResolved: z.boolean().default(false),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type SafetyReport = z.infer<typeof SafetyReportSchema>;

export const CreateSafetyReportInputSchema = z.object({
  trailId: EntityIdSchema.nullable().default(null),
  hazardType: HazardTypeSchema,
  severity: HazardSeveritySchema.default("moderate"),
  description: z.string().trim().min(1),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  altitudeM: z.number().int().nullable().default(null),
  localPhotoUris: z.array(z.string().min(1)).default([]),
});
export type CreateSafetyReportInput = z.infer<
  typeof CreateSafetyReportInputSchema
>;

export const AmsAlertLevelSchema = z.enum(["none", "caution", "warning"]);
export type AmsAlertLevel = z.infer<typeof AmsAlertLevelSchema>;

/** High-altitude AMS ascent monitor (>500m/day above 3,000m). */
export const AmsAlertSchema = z.object({
  level: AmsAlertLevelSchema,
  currentAltitudeM: z.number().int(),
  baselineAltitudeM: z.number().int(),
  ascent24hM: z.number().int(),
  thresholdM: z.number().int().positive().default(500),
  altitudeFloorM: z.number().int().positive().default(3000),
  message: z.string().min(1),
  evaluatedAt: IsoTimestampSchema,
});
export type AmsAlert = z.infer<typeof AmsAlertSchema>;

/** Off-trail drift evaluation (>60m from active trail polyline). */
export const OffTrailAlertSchema = z.object({
  isOffTrail: z.boolean(),
  distanceFromTrailM: z.number().nonnegative(),
  thresholdM: z.number().positive().default(60),
  nearestPoint: Position2DSchema,
  bearingToTrailDeg: z.number().min(0).max(360),
  evaluatedAt: IsoTimestampSchema,
});
export type OffTrailAlert = z.infer<typeof OffTrailAlertSchema>;

export const CardinalDirectionSchema = z.enum([
  "N",
  "NE",
  "E",
  "SE",
  "S",
  "SW",
  "W",
  "NW",
]);
export type CardinalDirection = z.infer<typeof CardinalDirectionSchema>;

export const NearestShelterSchema = z.object({
  waypointId: EntityIdSchema,
  name: z.string().min(1),
  category: WaypointCategorySchema,
  distanceM: z.number().nonnegative(),
  bearingDeg: z.number().min(0).max(360),
  cardinalDirection: CardinalDirectionSchema,
  altitudeM: z.number().int(),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
});
export type NearestShelter = z.infer<typeof NearestShelterSchema>;

export const SosReadingSchema = z.object({
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  formattedDD: z.string().min(1),
  formattedDMS: z.string().min(1),
  altitudeM: AltitudeMetersSchema.nullable(),
  accuracyM: z.number().nonnegative().nullable(),
  deviceHeadingDeg: z.number().min(0).max(360).nullable(),
  nearestShelter: NearestShelterSchema.nullable(),
  capturedAt: IsoTimestampSchema,
});
export type SosReading = z.infer<typeof SosReadingSchema>;
