import { allFieldsAreFilled, handleLogin } from "./LoginPageFunctions";

describe("LoginPageFunctions", () => {
  describe("allFieldsAreFilled", () => {
    it("should return true when both email and password fields are filled", () => {
      document.body.innerHTML = `
        <form name="loginInfo">
          <input name="email" value="test@example.com" />
          <input name="password" value="password123" />
        </form>
      `;
      // shorthand replacement in jsdom for chrome form references
      const form = Array.from(document.forms).find(
        (f) => f.name == "loginInfo",
      );
      form!.email = form!.elements[0];
      form!.password = form!.elements[1];
      expect(allFieldsAreFilled("loginInfo")).toBe(true);
    });

    it("should return false when email field is empty", () => {
      document.body.innerHTML = `
        <form name="loginInfo">
          <input name="email" value="" />
          <input name="password" value="password123" />
        </form>
      `;
      // shorthand replacement in jsdom for chrome form references
      const form = Array.from(document.forms).find(
        (f) => f.name == "loginInfo",
      );
      form!.email = form!.elements[0];
      form!.password = form!.elements[1];
      expect(allFieldsAreFilled("loginInfo")).toBe(false);
    });

    it("should return false when password field is empty", () => {
      document.body.innerHTML = `
        <form name="loginInfo">
          <input name="email" value="test@example.com" />
          <input name="password" value="" />
        </form>
      `;
      // shorthand replacement in jsdom for chrome form references
      const form = Array.from(document.forms).find(
        (f) => f.name == "loginInfo",
      );
      form!.email = form!.elements[0];
      form!.password = form!.elements[1];
      expect(allFieldsAreFilled("loginInfo")).toBe(false);
    });
  });

  describe("handleLogin", () => {
    window.fetch = jest.fn();
    beforeEach(() => {
      (window.fetch as jest.Mock).mockClear();
    });

    it("should call fetch with correct parameters when fields are filled", async () => {
      document.body.innerHTML = `
        <form name="loginInfo">
          <input name="email" value="test@example.com" />
          <input name="password" value="password123" />
        </form>
      `;
      // shorthand replacement in jsdom for chrome form references
      const form = Array.from(document.forms).find(
        (f) => f.name == "loginInfo",
      );
      form!.email = form!.elements[0];
      form!.password = form!.elements[1];
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
      document.body.innerHTML = `
        <form name="loginInfo">
          <input name="email" value="test@example.com" />
          <input name="password" value="password123" />
        </form>
      `;
      // shorthand replacement in jsdom for chrome form references
      const form = Array.from(document.forms).find(
        (f) => f.name == "loginInfo",
      );
      form!.email = form!.elements[0];
      form!.password = form!.elements[1];
      (window.fetch as jest.Mock).mockResolvedValue({
        status: 401,
        json: () => Promise.resolve({ message: "Invalid credentials" }),
      });

      await expect(
        handleLogin("test@example.com", "wrongpassword"),
      ).rejects.toThrow("Invalid credentials");
    });

    it("should alert when fields are not filled", async () => {
      document.body.innerHTML = `
        <form name="loginInfo">
          <input name="email" value="" />
          <input name="password" value="password123" />
        </form>
      `;
      // shorthand replacement in jsdom for chrome form references
      const form = Array.from(document.forms).find(
        (f) => f.name == "loginInfo",
      );
      form!.email = form!.elements[0];
      form!.password = form!.elements[1];
      window.alert = jest.fn();

      await handleLogin("", "");

      expect(window.alert).toHaveBeenCalledWith("Please fill out all fields");
    });
  });
});
