import {
  PostLoginSessionRequestBody,
  PostLoginSessionResponse,
} from "../api/login/route";
import { User } from "../types";

export const allFieldsAreFilled = (formName: string): boolean => {
  const form = Array.from(document.forms).find((f) => f.name == formName);
  return !!(form && form.email.value && form.password.value);
};

export async function handleLogin(): Promise<User | undefined> {
  if (allFieldsAreFilled("loginInfo")) {
    const form = Array.from(document.forms).find((f) => f.name == "loginInfo");
    const formData = new FormData(form);
    const formObject: Awaited<PostLoginSessionRequestBody> = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };
    const bodyString = JSON.stringify(formObject);
    const response = (await fetch("/api/login", {
      method: "POST",
      body: bodyString,
      headers: {
        "Content-Type": "application/json",
      },
    })) as PostLoginSessionResponse;
    if (response.status == 200) {
      return await response.json();
    } else {
      const textObject = await response.json();
      throw new Error(textObject.message || response.statusText);
    }
  } else {
    alert("Please fill out all fields");
  }
}
