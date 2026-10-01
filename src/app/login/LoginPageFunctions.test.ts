import { handleLogin } from "./LoginPageFunctions";

describe("LoginPageFunctions", () => {
  describe("handleLogin", () => {
    window.fetch = jest.fn();
    beforeEach(() => {
      (window.fetch as jest.Mock).mockClear();
    });

    it("should call fetch with correct parameters when fields are filled", async () => {
      (window.fetch as jest.Mock).mockResolvedValue({
        json: () => Promise.resolve({ id: 1, name: "John Doe" }),
        status: 200,
      });

      const user = await handleLogin("test@example.com", "password123");

      expect(fetch).toHaveBeenCalledWith("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      expect(user).toEqual({ id: 1, name: "John Doe" });
    });

    it("should throw an error when fetch response is not 200", async () => {
      (window.fetch as jest.Mock).mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ message: "Invalid credentials" }),
      });

      await expect(
        handleLogin("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should throw when fields are not filled", async () => {
      await expect(handleLogin("", "")).rejects.toThrow(
        "Please fill out all fields",
      );
    });
  });
});
