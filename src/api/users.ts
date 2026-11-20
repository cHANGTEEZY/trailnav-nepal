import { DUMMY_USER } from "@/lib/auth-client";
import type {
  CreateUserRequest,
  UpdateUserRequest,
  User,
  UsersListResponse,
} from "@/api/types";

const SEED_USERS: User[] = [
  {
    id: DUMMY_USER.id,
    name: DUMMY_USER.name,
    email: DUMMY_USER.email,
    image: DUMMY_USER.image,
    createdAt: DUMMY_USER.createdAt.toISOString(),
    updatedAt: DUMMY_USER.updatedAt.toISOString(),
  },
  {
    id: "user_tenzin",
    name: "Tenzin Gurung",
    email: "tenzin@trailnav.local",
    createdAt: "2026-02-03T00:00:00.000Z",
    updatedAt: "2026-02-03T00:00:00.000Z",
  },
  {
    id: "user_asha",
    name: "Asha Tamang",
    email: "asha@trailnav.local",
    createdAt: "2026-03-18T00:00:00.000Z",
    updatedAt: "2026-03-18T00:00:00.000Z",
  },
];

let users: User[] = SEED_USERS.map((user) => ({ ...user }));

function matchesQuery(user: User, query: string) {
  return (
    user.name.toLowerCase().includes(query) ||
    user.email.toLowerCase().includes(query)
  );
}

export const usersApi = {
  list: async (params?: { q?: string }): Promise<UsersListResponse> => {
    const query = params?.q?.trim().toLowerCase();
    const filtered = query
      ? users.filter((user) => matchesQuery(user, query))
      : users;
    return { users: filtered.map((user) => ({ ...user })) };
  },

  getById: async (id: string): Promise<User> => {
    const user = users.find((entry) => entry.id === id);
    if (!user) {
      throw new Error("User not found");
    }
    return { ...user };
  },

  create: async (data: CreateUserRequest): Promise<User> => {
    const now = new Date().toISOString();
    const user: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      createdAt: now,
      updatedAt: now,
    };
    users = [user, ...users];
    return { ...user };
  },

  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const index = users.findIndex((entry) => entry.id === id);
    if (index === -1) {
      throw new Error("User not found");
    }
    const user: User = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    users[index] = user;
    return { ...user };
  },

  remove: async (id: string): Promise<void> => {
    users = users.filter((entry) => entry.id !== id);
  },
};
