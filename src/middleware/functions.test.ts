import { getEncryptedToken, decryptToken } from "./functions";

describe("getEncryptedToken", () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, TOKEN_KEY: "testkey" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should encrypt user object into a token", () => {
    const user = { id: 1, email: "test@example.com", username: "testuser" };
    const token = getEncryptedToken(user);
    expect(typeof token).toBe("string");
    expect(token).not.toBe("");
  });

  it("should throw an error if TOKEN_KEY is not defined", () => {
    delete process.env.TOKEN_KEY;
    const user = { id: 1, email: "test@example.com", username: "testuser" };
    expect(() => getEncryptedToken(user)).toThrow();
  });
});

describe("decryptToken", () => {
  const originalEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, TOKEN_KEY: "testkey" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should decrypt token into user object", () => {
    const user = { id: 1, email: "test@example.com", username: "testuser" };
    const token = getEncryptedToken(user);
    const decryptedUser = decryptToken(token);
    expect(decryptedUser).toEqual({
      user_id: user.id,
      email: user.email,
      username: user.username,
    });
  });

  it("should return null if TOKEN_KEY is not defined", () => {
    delete process.env.TOKEN_KEY;
    const token = "someToken";
    const result = decryptToken(token);
    expect(result).toBeNull();
  });
});
