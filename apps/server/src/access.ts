import { createHash, timingSafeEqual } from "node:crypto";
import { loadEnvFile } from "node:process";
import { fileURLToPath } from "node:url";
import { ServerError } from "@colyseus/core";
import type { VisitorRole } from "@museum/shared";

try {
  loadEnvFile(fileURLToPath(new URL("../.env.local", import.meta.url)));
} catch (error) {
  if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
}

const attempts = new Map<string, { count: number; until: number }>();
export function authenticatePortal(
  options: { role?: unknown; password?: unknown },
  address: string,
): VisitorRole {
  const role = options.role ?? "guest";
  if (!["host", "girlfriend", "guest"].includes(String(role)))
    throw new ServerError(403, "Choose one of the three entrances.");
  if (role === "guest") return "guest";
  const now = Date.now();
  for (const [ip, value] of attempts)
    if (value.until < now) attempts.delete(ip);
  const attempt = attempts.get(address) ?? { count: 0, until: now + 60000 };
  if (attempt.count >= 8)
    throw new ServerError(429, "Too many attempts. Please wait a minute.");
  const expected =
    process.env[
      role === "host" ? "MUSEUM_HOST_PASSWORD" : "MUSEUM_GIRLFRIEND_PASSWORD"
    ];
  const supplied = typeof options.password === "string" ? options.password : "";
  if (!expected || expected.length < 12)
    throw new ServerError(503, "This private entrance is not set up yet.");
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (
    supplied.length > 256 ||
    !timingSafeEqual(digest(supplied), digest(expected))
  ) {
    attempt.count++;
    attempts.set(address, attempt);
    throw new ServerError(403, "That password does not open this entrance.");
  }
  return role as VisitorRole;
}
