"use client";
import { useCallback } from "react";
import Cookies from "js-cookie";
import { CookieUser, Note } from "../types";

const useAPI = (cookieUser: CookieUser) => {
  const _setCookieAndReturnUser = (user: string) => {
    // TODO: enable secure cookie when we switch to HTTPS
    // js-cookie handles JSON objects automatically.
    // It also correctly sets path, expiration, and SameSite attributes.
    Cookies.set("token", user, { expires: 7, sameSite: "Lax", path: "/" }); // `expires: 7` means 7 days
    return user;
  };

  const register = async (email: string, password: string) =>
    fetch("/api/users/register", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        return data;
      })
      .then(_setCookieAndReturnUser);

  const login = (email: string, password: string) =>
    fetch("/api/users/login", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          throw data.error;
        }
        return data;
      })
      .then(_setCookieAndReturnUser);

  const logout = (email: string) =>
    fetch(`/api/users/logout/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${cookieUser?.token}`,
        "x-email": email,
      },
    });

  const getNotes = useCallback(
    () =>
      fetch("/api/notes", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": cookieUser?.email,
        },
      }).then((response) => response.json()),
    [cookieUser],
  );

  const addNote = useCallback(
    (note: Note) =>
      fetch("/api/notes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": cookieUser?.email,
        },
        body: JSON.stringify(note),
      }).then((response) => response.json()),
    [cookieUser],
  );

  const deleteNote = useCallback(
    (note: Note) =>
      fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          "x-email": cookieUser?.email,
        },
      }),
    [cookieUser],
  );

  const updateNote = useCallback(
    (notePartial: Partial<Note>) =>
      fetch(`/api/notes/${notePartial.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": cookieUser?.email,
        },
        body: JSON.stringify(notePartial),
      }).then((response) => response.json()),
    [cookieUser],
  );

  const getFields = useCallback(
    () =>
      fetch("/api/fields", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          "x-email": cookieUser?.email,
        },
      }).then((response) => response.json()),
    [cookieUser],
  );

  const addField = useCallback(
    (fieldName: string) =>
      fetch("/api/fields", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": cookieUser?.email,
        },
        body: JSON.stringify({ name: fieldName }),
      }).then((response) => response.json()),
    [cookieUser],
  );

  const useField = useCallback(
    async (
      noteId: number,
      fieldId: number,
      value: string,
      newTextValue: string = "",
    ) => {
      const newField = {
        field_id: fieldId,
        note_id: noteId,
        value,
      };
      const results = [];
      results.push(
        await fetch(`/api/field_values`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${cookieUser?.token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-email": cookieUser?.email,
          },
          body: JSON.stringify(newField),
        })
          .then(async (response) => {
            if (!response.ok) {
              const errorData = await response.json();
              throw {
                ...errorData,
                status: response.status,
              };
            }
            return response.json();
          })
          .catch((err) => {
            throw err;
          }),
      );

      if (newTextValue !== undefined) {
        results.push(await updateNote({ id: noteId, text: newTextValue }));
      }
      return {
        id: noteId,
        field_values: [results[0]],
        text: results[1]?.text,
      };
    },
    [cookieUser?.email, cookieUser?.token, updateNote],
  );

  const updateFieldValue = useCallback(
    (noteId: number, fieldId: number, value: string) =>
      fetch(`/api/field_values/${noteId}/${fieldId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${cookieUser?.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-email": cookieUser?.email,
        },
        body: JSON.stringify({ value }),
      }).then((response) => response.json()),
    [cookieUser],
  );

  const deleteField = useCallback(
    (noteId: number, fieldId: number) =>
      fetch(`/api/field_values/${noteId}/${fieldId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${cookieUser.token}`,
          "x-email": cookieUser.email,
        },
      }),
    [cookieUser],
  );

  return {
    email: cookieUser?.email,
    fnToken: cookieUser?.token,
    register,
    login,
    logout,
    getNotes,
    addNote,
    deleteNote,
    updateNote,
    getFields,
    addField,
    useField,
    updateFieldValue,
    deleteField,
  };
};

export default useAPI;
