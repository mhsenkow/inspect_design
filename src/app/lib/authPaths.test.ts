import { friendlyAuthError, safeReturnPath } from "./authPaths";

describe("safeReturnPath", () => {
  it("returns fallback for empty values", () => {
    expect(safeReturnPath(null)).toBe("/insights");
    expect(safeReturnPath(undefined)).toBe("/insights");
    expect(safeReturnPath("")).toBe("/insights");
  });

  it("allows relative paths", () => {
    expect(safeReturnPath("/insights")).toBe("/insights");
    expect(safeReturnPath("/insights/abc")).toBe("/insights/abc");
  });

  it("blocks open redirects", () => {
    expect(safeReturnPath("//evil.com")).toBe("/insights");
    expect(safeReturnPath("https://evil.com")).toBe("/insights");
    expect(safeReturnPath("insights")).toBe("/insights");
  });
});

describe("friendlyAuthError", () => {
  it("softens credential errors", () => {
    expect(friendlyAuthError("Invalid credentials")).toBe(
      "Invalid email or password.",
    );
    expect(friendlyAuthError("User does not exist. Please register.")).toBe(
      "Invalid email or password.",
    );
  });

  it("passes through other messages", () => {
    expect(friendlyAuthError("Network error during login")).toBe(
      "Network error during login",
    );
  });
});
