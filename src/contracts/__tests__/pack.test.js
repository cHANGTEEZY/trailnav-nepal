import { expect, test } from "bun:test";

import {
  DownloadProgressSchema,
  InstalledPackSchema,
  KnownPackRegionIdSchema,
  PackCatalogSchema,
  RegionalPackManifestSchema,
} from "..";

const timestamp = "2026-11-25T02:45:00Z";
const artifact = {
  type: "trails_bundle",
  fileName: "trails.json",
  downloadUrl: "https://maps.example.com/poon-hill/trails.json",
  sizeBytes: 4096,
  sha256: "a".repeat(64),
};
const manifest = {
  id: " poon-hill ",
  name: " Poon Hill ",
  region: "Annapurna",
  description: "Offline trail map",
  version: "1",
  bounds: [83.62, 28.34, 83.76, 28.46],
  center: [83.69, 28.40],
  defaultZoom: 12,
  totalSizeBytes: 4096,
  trailCount: 1,
  waypointCount: 0,
  artifacts: [artifact],
  updatedAt: timestamp,
};

test("parses a catalog containing a bundle with no tile zoom limits", () => {
  const catalog = { version: "1", generatedAt: timestamp, packs: [manifest] };
  expect(PackCatalogSchema.parse(catalog)).toEqual({
    ...catalog,
    packs: [{
      ...manifest, id: "poon-hill", name: "Poon Hill",
      artifacts: [{ ...artifact, minZoom: null, maxZoom: null }],
    }],
  });
});

test("recognizes a built-in region while accepting new catalog region IDs", () => {
  expect(KnownPackRegionIdSchema.parse("poon-hill")).toBe("poon-hill");
  const newRegion = "dolpo";
  expect(KnownPackRegionIdSchema.safeParse(newRegion).success).toBe(false);
  expect(RegionalPackManifestSchema.parse({ ...manifest, id: newRegion }).id).toBe(newRegion);
  expect(RegionalPackManifestSchema.safeParse({ ...manifest, id: " " }).success).toBe(false);
});

test.each([
  ["no artifacts", { artifacts: [] }],
  ["a relative artifact URL", { artifacts: [{ ...artifact, downloadUrl: "/trails.json" }] }],
  ["a negative artifact size", { artifacts: [{ ...artifact, sizeBytes: -1 }] }],
  ["an unsupported tile zoom", { artifacts: [{ ...artifact, maxZoom: 23 }] }],
  ["a malformed bounding box", { bounds: [83, 28, 84] }],
  ["a fractional trail count", { trailCount: 1.5 }],
])("rejects a pack manifest with %s", (_label, overrides) => {
  expect(RegionalPackManifestSchema.safeParse({ ...manifest, ...overrides }).success).toBe(false);
});

test("accepts an installed pack without optional tiles or download metadata", () => {
  const pack = {
    regionId: "poon-hill",
    version: "1",
    status: "installed",
    localDirectoryUri: "file:///packs/poon-hill/",
    installedSizeBytes: 4096,
  };
  expect(InstalledPackSchema.parse(pack)).toEqual({
    ...pack, vectorTilesUri: null, demTilesUri: null, downloadedAt: null, lastError: null,
  });
});

test("accepts progress at either endpoint and rejects percentages above one", () => {
  const progress = { regionId: "poon-hill", bytesWritten: 0, totalBytes: 4096, progress: 0, status: "downloading" };
  expect(DownloadProgressSchema.parse(progress)).toEqual({
    ...progress, artifactType: null, errorMessage: null,
  });
  expect(DownloadProgressSchema.safeParse({
    ...progress, bytesWritten: 4096, progress: 1, status: "installed",
  }).success).toBe(true);
  expect(DownloadProgressSchema.safeParse({ ...progress, progress: 100 }).success).toBe(false);
  expect(DownloadProgressSchema.safeParse({ ...progress, bytesWritten: -1 }).success).toBe(false);
});
