"use client";
import { useEffect, useState } from "react";
import { encodeStringURI } from "./functions";
import { decryptToken } from "../../middleware/functions";

const useUser = () => {
  // Initialize state with parsed cookie data to avoid re-parsing on every mount
  const [token, setToken] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const cookieToken = document.cookie
      .split(";")
      .find((row) => row.trim().startsWith("token="))
      ?.split("=")[1];
    return cookieToken;
  });
  
  const [userDetails, setUserDetails] = useState<{
    user_id: number;
    email: string;
    username: string;
  } | undefined>(() => {
    if (typeof window === 'undefined') return undefined;
    const cookieToken = document.cookie
      .split(";")
      .find((row) => row.trim().startsWith("token="))
      ?.split("=")[1];
    if (cookieToken) {
      const details = decryptToken(
        cookieToken,
        process.env.NEXT_PUBLIC_TOKEN_KEY ||
          "your-secret-jwt-key-change-this-in-production",
      );
      return details || undefined;
    }
    return undefined;
  });
  
  const [loggedIn, setLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false;
    const cookieToken = document.cookie
      .split(";")
      .find((row) => row.trim().startsWith("token="))
      ?.split("=")[1];
    return !!cookieToken;
  });
  
  useEffect(() => {
    // Initialize state on client side after hydration
    if (typeof window !== 'undefined') {
      const cookieToken = document.cookie
        .split(";")
        .find((row) => row.trim().startsWith("token="))
        ?.split("=")[1];
      
      if (cookieToken && !token) {
        setToken(cookieToken);
        const details = decryptToken(
          cookieToken,
          process.env.NEXT_PUBLIC_TOKEN_KEY ||
            "your-secret-jwt-key-change-this-in-production",
        );
        if (details) {
          setUserDetails(details);
          setLoggedIn(true);
        } else {
          // If token is invalid, clear it
          setLoggedIn(false);
          setToken(undefined);
          document.cookie = `token=; path=/; expires=${new Date(0)}`;
        }
      } else if (!cookieToken) {
        setLoggedIn(false);
        setToken(undefined);
        setUserDetails(undefined);
      }
    }
  }, []);

  useEffect(() => {
    // Only run effect if token exists but userDetails is missing (edge case)
    if (token && !userDetails) {
      const details = decryptToken(
        token,
        process.env.NEXT_PUBLIC_TOKEN_KEY ||
          "your-secret-jwt-key-change-this-in-production",
      );
      if (details) {
        setUserDetails(details);
        setLoggedIn(true);
      } else {
        // If token is invalid, clear it
        setLoggedIn(false);
        setToken(undefined);
        document.cookie = `token=; path=/; expires=${new Date(0)}`;
      }
    }
  }, [token, userDetails]);

  const exportedSetToken = (token: string) => {
    const encodedToken = encodeStringURI(token);
    setToken(encodedToken);
    const date = new Date();
    date.setDate(date.getDate() + 400);
    document.cookie = `token=${encodedToken}; path=/; expires=${date.toUTCString()}`;
  };


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
