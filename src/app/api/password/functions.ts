import crypto from "crypto";
import bcrypt from "bcryptjs";

import { UserLibSqlModel, UserPostgresModel } from "../models/users";
import { SessionModel } from "../models/sessions";

const RESET_TTL_MS = 1000 * 60 * 60; // 1 hour

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function buildResetPayload(token: string): string {
  const expiresAt = Date.now() + RESET_TTL_MS;
  return `${token}.${expiresAt}`;
}

export function parseResetPayload(
  payload: string | null | undefined,
): { token: string; expiresAt: number } | null {
  if (!payload) return null;
  const [token, expiresRaw] = payload.split(".");
  const expiresAt = Number(expiresRaw);
  if (!token || !Number.isFinite(expiresAt)) return null;
  return { token, expiresAt };
}

export function isResetPayloadValid(
  stored: string | null | undefined,
  providedToken: string,
): boolean {
  const parsed = parseResetPayload(stored);
  if (!parsed) return false;
  if (parsed.expiresAt < Date.now()) return false;
  const a = Buffer.from(parsed.token);
  const b = Buffer.from(providedToken);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function getPasswordResetKey(
  user: UserLibSqlModel & { passwordResetKey?: string | null },
): string | null | undefined {
  return user.passwordResetKey;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password.trim(), 10);
}

export async function updateUserPassword(
  userId: number,
  encryptedPassword: string,
): Promise<void> {
  await UserLibSqlModel.query().patchAndFetchById(userId, {
    password: encryptedPassword,
    passwordResetKey: null,
  } as Partial<UserLibSqlModel>);

  try {
    await UserPostgresModel.query().patchAndFetchById(userId, {
      password: encryptedPassword,
      passwordResetKey: null,
    } as Partial<UserPostgresModel>);
  } catch (error) {
    console.warn("Postgres password sync skipped:", error);
  }
}

export async function clearSessionsForUser(userId: number): Promise<void> {
  await SessionModel.query().delete().where("user_id", userId);
}

export async function setPasswordResetKey(
  user: UserLibSqlModel,
): Promise<{ token: string; payload: string }> {
  const token = generateResetToken();
  const payload = buildResetPayload(token);
  await UserLibSqlModel.query().patchAndFetchById(user.id!, {
    passwordResetKey: payload,
  } as Partial<UserLibSqlModel>);

  try {
    await UserPostgresModel.query().patchAndFetchById(user.id!, {
      passwordResetKey: payload,
    } as Partial<UserPostgresModel>);
  } catch {
    /* optional sync */
  }

  return { token, payload };
}
