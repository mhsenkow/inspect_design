import { act, renderHook } from "@testing-library/react";

import useUser from "../useUser";
import { decryptToken } from "../../../middleware/functions";

jest.mock("../../../middleware/functions");

describe("useUser hook", () => {
  beforeEach(() => {
    // Clear all cookies before each test
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    (decryptToken as jest.Mock).mockReturnValue({});
  });

  it("should initialize with default values", () => {
    const { result } = renderHook(() => useUser());

    expect(result.current.loggedIn).toBe(false);
    expect(result.current.token).toBeUndefined();
  });

  it("should set token and loggedIn state when token is found in cookies", () => {
    document.cookie = "token=testToken";

    const { result } = renderHook(() => useUser());

    expect(result.current.token).toBe("testToken");
    expect(result.current.loggedIn).toBe(true);
  });

  it("should set token and cookie when setToken is called", () => {
    const { result } = renderHook(() => useUser());

    act(() => {
      result.current.setToken("newToken");
    });

    expect(result.current.token).toBe("newToken");
    expect(document.cookie).toContain("token=newToken");
  });

  it("should clear token and set loggedIn to false when logout is called", () => {
    document.cookie = "token=testToken";

    const { result } = renderHook(() => useUser());

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeUndefined();
    expect(result.current.loggedIn).toBe(false);
    expect(document.cookie).not.toContain("token=testToken");
  });
});
