import { expect, test } from "bun:test";

import {
  PresignedUploadRequestSchema,
  PresignedUploadResponseSchema,
  SyncBatchRequestSchema,
  SyncBatchResponseSchema,
  SyncQueueItemSchema,
} from "..";

const timestamp = "2026-11-25T02:45:00Z";
const event = {
  entityType: "recorded_track",
  entityId: "track-1",
  operation: "create",
};
const payload = { title: "Poon Hill loop", samples: [{ altitudeM: 2860 }], endedAt: null };

test("defaults a new outbox item to zero attempts and preserves its serialized payload", () => {
  const item = {
    ...event,
    id: "event-1",
    payloadJson: JSON.stringify(payload),
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  expect(SyncQueueItemSchema.parse(item)).toEqual({
    ...item, attemptCount: 0, lastError: null, nextRetryAt: null,
  });
  expect(SyncQueueItemSchema.safeParse({ ...item, attemptCount: -1 }).success).toBe(false);
  expect(SyncQueueItemSchema.safeParse({ ...item, payloadJson: payload }).success).toBe(false);
});

test("preserves entity-specific batch payloads but requires each payload to be an object", () => {
  const item = { ...event, clientEventId: "event-1", payload, clientUpdatedAt: timestamp };
  const batch = { deviceId: "device-1", items: [item] };
  expect(SyncBatchRequestSchema.parse(batch)).toEqual(batch);
  expect(SyncBatchRequestSchema.safeParse({
    ...batch, items: [{ ...item, payload: JSON.stringify(payload) }],
  }).success).toBe(false);
  expect(SyncBatchRequestSchema.safeParse({
    ...batch, items: [{ ...item, operation: "upsert" }],
  }).success).toBe(false);
});

test("keeps duplicate and rejected outcomes distinct within one response", () => {
  const duplicate = { clientEventId: "event-1", entityId: "track-1", status: "duplicate" };
  const rejected = {
    clientEventId: "event-2", entityId: "track-2", status: "rejected",
    errorCode: "INVALID_TRACK", errorMessage: "Track has no points",
  };
  const response = { syncedAt: timestamp, results: [duplicate, rejected] };
  expect(SyncBatchResponseSchema.parse(response)).toEqual({
    ...response,
    results: [
      { ...duplicate, serverId: null, errorCode: null, errorMessage: null },
      { ...rejected, serverId: null },
    ],
  });
  expect(SyncBatchResponseSchema.safeParse({
    ...response, results: [{ ...duplicate, status: "pending" }],
  }).success).toBe(false);
});

test("normalizes upload metadata and requires a positive, whole byte count", () => {
  const request = {
    purpose: "hazard_photo",
    entityId: "hazard-1",
    fileName: " bridge.jpg ",
    contentType: " image/jpeg ",
    sizeBytes: 1,
  };
  expect(PresignedUploadRequestSchema.parse(request)).toEqual({
    ...request, fileName: "bridge.jpg", contentType: "image/jpeg",
  });
  expect(PresignedUploadRequestSchema.safeParse({ ...request, sizeBytes: 0 }).success).toBe(false);
  expect(PresignedUploadRequestSchema.safeParse({ ...request, sizeBytes: 1.5 }).success).toBe(false);
});

test("preserves signed upload URLs and headers while allowing replies with no headers", () => {
  const reply = {
    uploadUrl: "https://uploads.example.com/hazards/bridge.jpg?signature=example",
    publicUrl: "https://media.example.com/hazards/bridge.jpg",
    objectKey: "hazards/bridge.jpg",
    expiresAt: timestamp,
  };
  expect(PresignedUploadResponseSchema.parse(reply)).toEqual({ ...reply, requiredHeaders: {} });
  const requiredHeaders = { "content-type": "image/jpeg" };
  expect(PresignedUploadResponseSchema.parse({ ...reply, requiredHeaders })).toEqual({
    ...reply, requiredHeaders,
  });
  expect(PresignedUploadResponseSchema.safeParse({
    ...reply, requiredHeaders: { "content-length": 1 },
  }).success).toBe(false);
});
