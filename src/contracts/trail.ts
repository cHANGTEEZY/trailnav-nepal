import { z } from "zod";

export const EntityIdSchema = z.string().min(1);
export type EntityId = z.infer<typeof EntityIdSchema>;

export const IsoTimestampSchema = z.iso.datetime({ offset: true });
export type IsoTimestamp = z.infer<typeof IsoTimestampSchema>;

export const LatitudeSchema = z.number().min(-90).max(90);
export const LongitudeSchema = z.number().min(-180).max(180);
export const AltitudeMetersSchema = z.number().min(-500).max(9000);

/** GeoJSON coordinate order: [longitude, latitude]. */
export const Position2DSchema = z.tuple([LongitudeSchema, LatitudeSchema]);
export type Position2D = z.infer<typeof Position2DSchema>;

/** GeoJSON 3D coordinate order: [longitude, latitude, altitudeMeters]. */
export const Position3DSchema = z.tuple([
  LongitudeSchema,
  LatitudeSchema,
  AltitudeMetersSchema,
]);
export type Position3D = z.infer<typeof Position3DSchema>;

/**
 * GeoJSON LineStringZM coordinate order:
 * [longitude, latitude, altitudeMeters, measure (epoch ms or cumulative distance m)].
 */
export const Position4DSchema = z.tuple([
  LongitudeSchema,
  LatitudeSchema,
  AltitudeMetersSchema,
  z.number().nonnegative(),
]);
export type Position4D = z.infer<typeof Position4DSchema>;

/** MapLibre / GeoJSON bounding box: [west, south, east, north]. */
export const BoundingBoxSchema = z.tuple([
  LongitudeSchema,
  LatitudeSchema,
  LongitudeSchema,
  LatitudeSchema,
]);
export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const GeoJsonPointSchema = z.object({
  type: z.literal("Point"),
  coordinates: Position2DSchema,
});
export type GeoJsonPoint = z.infer<typeof GeoJsonPointSchema>;

export const GeoJsonPointZSchema = z.object({
  type: z.literal("Point"),
  coordinates: Position3DSchema,
});
export type GeoJsonPointZ = z.infer<typeof GeoJsonPointZSchema>;

export const GeoJsonLineStringZMSchema = z.object({
  type: z.literal("LineString"),
  coordinates: z.array(Position4DSchema).min(2),
});
export type GeoJsonLineStringZM = z.infer<typeof GeoJsonLineStringZMSchema>;

export const TrailDifficultySchema = z.enum([
  "easy",
  "moderate",
  "hard",
  "alpine",
]);
export type TrailDifficulty = z.infer<typeof TrailDifficultySchema>;

export const TrailStatusSchema = z.enum([
  "verified",
  "community_pending",
  "community_approved",
]);
export type TrailStatus = z.infer<typeof TrailStatusSchema>;

export const WaypointCategorySchema = z.enum([
  "viewpoint",
  "teahouse",
  "water_source",
  "pass",
  "monastery",
  "hazard",
]);
export type WaypointCategory = z.infer<typeof WaypointCategorySchema>;

export const TrailSchema = z.object({
  id: EntityIdSchema,
  title: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  region: z.string().trim().min(1),
  description: z.string().nullable().default(null),
  difficulty: TrailDifficultySchema,
  distanceKm: z.number().nonnegative(),
  elevationGainM: z.number().int().nonnegative(),
  elevationLossM: z.number().int().nonnegative().nullable().default(null),
  minAltitudeM: z.number().int().nullable().default(null),
  maxAltitudeM: z.number().int(),
  bbox: BoundingBoxSchema.nullable().default(null),
  geom: GeoJsonLineStringZMSchema,
  status: TrailStatusSchema,
  packRegionId: z.string().min(1).nullable().default(null),
  createdBy: EntityIdSchema,
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type Trail = z.infer<typeof TrailSchema>;

export const TrailSummarySchema = TrailSchema.omit({ geom: true });
export type TrailSummary = z.infer<typeof TrailSummarySchema>;

export const WaypointSchema = z.object({
  id: EntityIdSchema,
  trailId: EntityIdSchema.nullable().default(null),
  region: z.string().trim().min(1).nullable().default(null),
  category: WaypointCategorySchema,
  name: z.string().trim().min(1),
  description: z.string().nullable().default(null),
  geom: GeoJsonPointZSchema,
  altitudeM: z.number().int(),
  photoUrls: z.array(z.string().min(1)).default([]),
  createdAt: IsoTimestampSchema,
  updatedAt: IsoTimestampSchema,
});
export type Waypoint = z.infer<typeof WaypointSchema>;

export const TrailWithWaypointsSchema = TrailSchema.extend({
  waypoints: z.array(WaypointSchema),
});
export type TrailWithWaypoints = z.infer<typeof TrailWithWaypointsSchema>;

export const OfflineSearchResultKindSchema = z.enum(["trail", "waypoint"]);
export type OfflineSearchResultKind = z.infer<
  typeof OfflineSearchResultKindSchema
>;

export const OfflineSearchResultSchema = z.object({
  id: EntityIdSchema,
  kind: OfflineSearchResultKindSchema,
  title: z.string().min(1),
  subtitle: z.string().nullable().default(null),
  region: z.string().min(1).nullable().default(null),
  category: WaypointCategorySchema.nullable().default(null),
  difficulty: TrailDifficultySchema.nullable().default(null),
  status: TrailStatusSchema.nullable().default(null),
  altitudeM: z.number().int().nullable().default(null),
  latitude: LatitudeSchema,
  longitude: LongitudeSchema,
  trailId: EntityIdSchema.nullable().default(null),
  score: z.number().nullable().default(null),
});
export type OfflineSearchResult = z.infer<typeof OfflineSearchResultSchema>;
