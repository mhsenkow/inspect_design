/**
 * @jest-environment node
 */

import {
  buildResetPayload,
  generateResetToken,
  isResetPayloadValid,
  parseResetPayload,
} from "./functions";

describe("password reset helpers", () => {
  it("generates opaque hex tokens", () => {
    const token = generateResetToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(generateResetToken()).not.toEqual(token);
  });

  it("builds and parses a payload with expiry", () => {
    const token = "abc123";
    const payload = buildResetPayload(token);
    const parsed = parseResetPayload(payload);
    expect(parsed?.token).toBe(token);
    expect(parsed?.expiresAt).toBeGreaterThan(Date.now());
  });

  it("accepts a matching unexpired token", () => {
    const token = generateResetToken();
    const payload = buildResetPayload(token);
    expect(isResetPayloadValid(payload, token)).toBe(true);
  });

  it("rejects mismatched or expired tokens", () => {
    const token = generateResetToken();
    const payload = buildResetPayload(token);
    expect(isResetPayloadValid(payload, "nope")).toBe(false);
    expect(isResetPayloadValid(`${token}.1`, token)).toBe(false);
    expect(isResetPayloadValid(null, token)).toBe(false);
    expect(isResetPayloadValid("broken", token)).toBe(false);
  });
});
