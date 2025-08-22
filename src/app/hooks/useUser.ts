"use client";
import { useEffect, useState } from "react";
import { encodeStringURI } from "./functions";
import { decryptToken } from "../../middleware/functions";

const useUser = () => {
  const [token, setToken] = useState<string>();
  const [userDetails, setUserDetails] = useState<{
    user_id: number;
    email: string;
    username: string;
  }>();
  useEffect(() => {
    const token = document.cookie
      .split(";")
      .find((row) => row.trim().startsWith("token="))
      ?.split("=")[1];
    if (token) {
      setToken(token);
      setLoggedIn(true);
      const { user_id, email, username } = decryptToken(
        token!,
        "secret", // TODO: get from .env
      );
      setUserDetails({ user_id, email, username });
    }
  }, []);

  const exportedSetToken = (token: string) => {
    const encodedToken = encodeStringURI(token);
    setToken(encodedToken);
    const date = new Date();
    date.setDate(date.getDate() + 400);
    document.cookie = `token=${encodedToken}; path=/; expires=${date.toUTCString()}`;
  };

  const [loggedIn, setLoggedIn] = useState(false);

  const logout = () => {
    document.cookie = `token=; path=/; expires=${new Date(0)}`;
    setLoggedIn(false);
    setToken(undefined);
  };

  return {
    loggedIn,
    logout,
    setLoggedIn,
    token,
    setToken: exportedSetToken,
    user_id: userDetails?.user_id,
    email: userDetails?.email,
    username: userDetails?.username,
  };
};

export default useUser;
