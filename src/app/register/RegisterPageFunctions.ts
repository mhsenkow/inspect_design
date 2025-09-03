import {
  RegisterPostRouteRequestBody,
  RegisterPostRouteResponse,
} from "../api/register/route";
import { User } from "../types";

export const allFieldsAreFilled = (formName: string) => {
  const form = Array.from(document.forms).find((f) => f.name == formName);
  return form && form.email.value && form.username.value && form.password.value;
};

export async function handleRegister(): Promise<User | undefined> {
  if (allFieldsAreFilled("registerInfo")) {
    const form = Array.from(document.forms).find(
      (f) => f.name == "registerInfo",
    );
    const formData = new FormData(form);
    const formObject: Awaited<RegisterPostRouteRequestBody> = {
      enable_email_notifications: false,
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    const bodyString = JSON.stringify(formObject);

    try {
      const response = (await fetch("/api/register", {
        method: "POST",
        body: bodyString,
        headers: {
          "Content-Type": "application/json",
        },
      })) as RegisterPostRouteResponse;

      if (response.status === 201) {
        return await response.json();
      } else {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            `Registration failed: ${response.status} ${response.statusText}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      } else {
        throw new Error("Network error during registration");
      }
    }
  } else {
    alert("Please fill out all fields");
  }
}
