import { z } from "zod";

import {
  BoundingBoxSchema,
  IsoTimestampSchema,
  Position2DSchema,
} from "./trail";

export const KnownPackRegionIdSchema = z.enum([
  "poon-hill",
  "annapurna-circuit",
  "khumbu-ebc",
  "langtang-valley",
  "manaslu-circuit",
]);
export type KnownPackRegionId = z.infer<typeof KnownPackRegionIdSchema>;

export const PackRegionIdSchema = z.string().trim().min(1);
export type PackRegionId = z.infer<typeof PackRegionIdSchema>;

export const PackArtifactTypeSchema = z.enum([
  "vector_mbtiles",
  "dem_mbtiles",
  "trails_bundle",
  "style_json",
]);
export type PackArtifactType = z.infer<typeof PackArtifactTypeSchema>;

export const PackArtifactSchema = z.object({
  type: PackArtifactTypeSchema,
  fileName: z.string().min(1),
  downloadUrl: z.url(),
  sizeBytes: z.number().int().nonnegative(),
  sha256: z.string().min(1),
  minZoom: z.number().int().min(0).max(22).nullable().default(null),
  maxZoom: z.number().int().min(0).max(22).nullable().default(null),
});
export type PackArtifact = z.infer<typeof PackArtifactSchema>;

export const RegionalPackManifestSchema = z.object({
  id: PackRegionIdSchema,
  name: z.string().trim().min(1),
  region: z.string().trim().min(1),
  description: z.string().trim().min(1),
  version: z.string().trim().min(1),
  bounds: BoundingBoxSchema,
  center: Position2DSchema,
  defaultZoom: z.number().min(0).max(22),
  totalSizeBytes: z.number().int().nonnegative(),
  trailCount: z.number().int().nonnegative(),
  waypointCount: z.number().int().nonnegative(),
  artifacts: z.array(PackArtifactSchema).min(1),
  updatedAt: IsoTimestampSchema,
});
export type RegionalPackManifest = z.infer<typeof RegionalPackManifestSchema>;

export const PackCatalogSchema = z.object({
  version: z.string().min(1),
  generatedAt: IsoTimestampSchema,
  packs: z.array(RegionalPackManifestSchema),
});
export type PackCatalog = z.infer<typeof PackCatalogSchema>;

export const PackInstallStatusSchema = z.enum([
  "not_installed",
  "downloading",
  "paused",
  "installed",
  "update_available",
  "error",
]);
export type PackInstallStatus = z.infer<typeof PackInstallStatusSchema>;

export const InstalledPackSchema = z.object({
  regionId: PackRegionIdSchema,
  version: z.string().min(1),
  status: PackInstallStatusSchema,
  localDirectoryUri: z.string().min(1),
  vectorTilesUri: z.string().min(1).nullable().default(null),
  demTilesUri: z.string().min(1).nullable().default(null),
  installedSizeBytes: z.number().int().nonnegative(),
  downloadedAt: IsoTimestampSchema.nullable().default(null),
  lastError: z.string().nullable().default(null),
});
export type InstalledPack = z.infer<typeof InstalledPackSchema>;

export const DownloadProgressSchema = z.object({
  regionId: PackRegionIdSchema,
  artifactType: PackArtifactTypeSchema.nullable().default(null),
  bytesWritten: z.number().int().nonnegative(),
  totalBytes: z.number().int().nonnegative(),
  progress: z.number().min(0).max(1),
  status: PackInstallStatusSchema,
  errorMessage: z.string().nullable().default(null),
});
export type DownloadProgress = z.infer<typeof DownloadProgressSchema>;
