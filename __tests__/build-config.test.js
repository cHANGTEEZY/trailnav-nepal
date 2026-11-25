import { expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { transformSync } from "@babel/core";

import metroConfig from "../metro.config";

test("Metro classifies tile archives as assets and SQL migrations as source", () => {
  const { assetExts, sourceExts } = metroConfig.resolver;
  expect(assetExts).toContain("mbtiles");
  expect(sourceExts).not.toContain("mbtiles");
  expect(sourceExts).toContain("sql");
  expect(assetExts).not.toContain("sql");
});

test("Babel embeds the SQL text in the importing module", () => {
  const directory = mkdtempSync(join(tmpdir(), "trailnav-migration-"));
  const sql = "CREATE TABLE trails (id TEXT PRIMARY KEY);";
  try {
    writeFileSync(join(directory, "migration.sql"), sql);
    const { code } = transformSync(
      'import migration from "./migration.sql"; export default migration;',
      {
        filename: join(directory, "migrations.js"),
        configFile: join(import.meta.dir, "../babel.config.js"),
        babelrc: false,
      },
    );
    expect(code).toContain(sql);
    expect(code).not.toContain("./migration.sql");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
