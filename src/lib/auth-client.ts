import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

import { getApiUrl } from "@/utils/env";

/**
 * Local stand-in until the API exists. The app treats this user as signed in
 * and never calls Better Auth on boot.
 */
export const DUMMY_USER = {
  id: "user_maya",
  name: "Maya Sherpa",
  email: "maya@trailnav.local",
  emailVerified: true,
  image: null,
  createdAt: new Date("2026-01-12T00:00:00.000Z"),
  updatedAt: new Date("2026-01-12T00:00:00.000Z"),
};

const DUMMY_SESSION = {
  session: {
    id: "session_local",
    userId: DUMMY_USER.id,
    token: "local-session",
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    createdAt: DUMMY_USER.createdAt,
    updatedAt: DUMMY_USER.updatedAt,
  },
  user: DUMMY_USER,
};

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
  plugins: [
    // Expo plugin types lag behind better-auth core fetch typings.
    // @ts-expect-error TS2322 — getActions signature mismatch between packages
    expoClient({
      scheme: "receiptrival",
      storagePrefix: "receiptrival",
      storage: SecureStore,
    }),
  ],
});

export const { signIn, signUp, signOut } = authClient;

export function useSession() {
  return {
    data: DUMMY_SESSION,
    isPending: false,
    isRefetching: false,
    error: null,
    refetch: async () => ({ data: DUMMY_SESSION }),
  };
}

export function getCookie(): string {
  return "";
}
