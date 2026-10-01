import {
  PostLoginSessionRequestBody,
  PostLoginSessionResponse,
} from "../api/login/route";
import { User } from "../types";

export async function handleLogin(
  email: string,
  password: string,
): Promise<User | undefined> {
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  if (!(trimmedEmail && trimmedPassword)) {
    throw new Error("Please fill out all fields");
  }

  const formObject: Awaited<PostLoginSessionRequestBody> = {
    email: trimmedEmail,
    password: trimmedPassword,
  };

  try {
    const response = (await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify(formObject),
      headers: {
        "Content-Type": "application/json",
      },
    })) as PostLoginSessionResponse;

    if (response.status === 200) {
      return await response.json();
    }

    const errorData = await response.json();
    throw new Error(
      errorData.message ||
        `Login failed: ${response.status} ${response.statusText}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error during login");
  }
}
