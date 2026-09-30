import { createHash } from "node:crypto";

export function getBankPrivacySecret() {
  const secret = process.env.BANK_PRIVACY_SECRET || process.env.SESSION_SECRET;
  if (!secret) throw new Error("BANK_PRIVACY_SECRET or SESSION_SECRET must be configured");
  return secret;
}

export function anonymousEntityId(bankCode: string, customerId: string) {
  const digest = createHash("sha256")
    .update(`${getBankPrivacySecret()}:${bankCode}:${customerId}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `EXT-${bankCode}-${digest}`;
}