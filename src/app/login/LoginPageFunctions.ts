import {
  PostLoginSessionRequestBody,
  PostLoginSessionResponse,
} from "../api/login/route";
import { User } from "../types";

export const allFieldsAreFilled = (formName: string): boolean => {
  const form = Array.from(document.forms).find((f) => f.name == formName);
  return !!(form && form.email.value && form.password.value);
};

export async function handleLogin(
  email: string,
  password: string,
): Promise<User | undefined> {
  if (email && password) {
    const formObject: Awaited<PostLoginSessionRequestBody> = {
      email,
      password,
    };
    const bodyString = JSON.stringify(formObject);

    try {
      const response = (await fetch("/api/login", {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json",
        },
      })) as PostLoginSessionResponse;

      if (response.status === 200) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Login failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Network error during login");
      }
    }
  } else {
    alert("Please fill out all fields");
  }
}
