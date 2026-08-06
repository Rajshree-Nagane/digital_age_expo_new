import { createHash, randomBytes } from "crypto";

const SUPPORTED_ALGOS = new Set(["md5", "sha1", "sha256"]);

/** Mirrors class_authentication.php::verifyPassword() algo resolution: unknown/legacy names fall back to md5, 'sha2' aliases to sha256. */
function resolveAlgo(algo: string): string {
  if (algo === "sha2") return "sha256";
  return SUPPORTED_ALGOS.has(algo) ? algo : "md5";
}

export function generateSalt(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(plainPassword: string, salt: string, algo = "sha256"): string {
  return createHash(resolveAlgo(algo)).update(plainPassword + salt).digest("hex");
}

export function verifyPassword(
  plainPassword: string,
  salt: string,
  algo: string,
  storedHash: string,
): boolean {
  return hashPassword(plainPassword, salt, algo) === storedHash;
}
