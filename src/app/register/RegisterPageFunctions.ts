import {
  RegisterPostRouteRequestBody,
  RegisterPostRouteResponse,
} from "../api/register/route";
import { User } from "../types";

type RegisterInput = {
  email: string;
  username: string;
  password: string;
};

export async function handleRegister(
  input: RegisterInput,
): Promise<User | undefined> {
  const email = input.email.trim();
  const username = input.username.trim();
  const password = input.password.trim();

  if (!(email && username && password)) {
    throw new Error("Please fill out all fields");
  }

  const formObject: Awaited<RegisterPostRouteRequestBody> = {
    enable_email_notifications: false,
    username,
    email,
    password,
  };

  try {
    const response = (await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(formObject),
      headers: {
        "Content-Type": "application/json",
      },
    })) as RegisterPostRouteResponse;

    if (response.status === 201) {
      return await response.json();
    }

    const errorData = await response.json();
    throw new Error(
      errorData.message ||
        `Registration failed: ${response.status} ${response.statusText}`,
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error during registration");
  }
}
