import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { UniqueViolationError } from "objection";

import { User } from "../../types";
import { createSession } from "../../../proxy/functions";
import { UserLibSqlModel, UserPostgresModel } from "../models/users";

export type RegisterPostRouteRequestBody = Promise<{
  username: string;
  email: string;
  password: string;
  enable_email_notifications: boolean;
}>;

interface RegisterPostRouteRequest extends NextRequest {
  json: () => RegisterPostRouteRequestBody;
}

export type RegisterPostRouteResponse = NextResponse<
  User | { message: string }
>;

const isUniqueEmailError = (error: unknown): boolean => {
  if (error instanceof UniqueViolationError) {
    return error.columns?.includes("email") ?? true;
  }

  if (error && typeof error === "object") {
    const sqliteError = error as {
      code?: string;
      message?: string;
      constraint?: string;
    };

    if (
      sqliteError.code === "SQLITE_CONSTRAINT_UNIQUE" ||
      sqliteError.code === "23505"
    ) {
      return (
        sqliteError.message?.toLowerCase().includes("email") ||
        sqliteError.constraint?.toLowerCase().includes("email") ||
        true
      );
    }

    if (sqliteError.message?.toLowerCase().includes("unique")) {
      return sqliteError.message.toLowerCase().includes("email");
    }
  }

  return false;
};

const toPublicUser = (user: UserLibSqlModel, token: string): User => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _password, ...safeUser } = user;
  return {
    id: safeUser.id,
    username: safeUser.username,
    email: safeUser.email,
    token,
    enable_email_notifications: Boolean(
      (safeUser as { enableEmailNotifications?: boolean })
        .enableEmailNotifications,
    ),
  };
};

export async function POST(
  req: RegisterPostRouteRequest,
): Promise<RegisterPostRouteResponse> {
  const { username, email, password } = await req.json();

  const trimmedUsername = username?.trim();
  const normalizedEmail = email?.toLocaleLowerCase().trim();
  const trimmedPassword = password?.trim();

  if (!(normalizedEmail && trimmedPassword && trimmedUsername)) {
    return NextResponse.json(
      { message: "All input is required" },
      { status: 400 },
    );
  }

  if (trimmedPassword.length < 6) {
    return NextResponse.json(
      { message: "Password must be at least 6 characters" },
      { status: 400 },
    );
  }

  const existingUser = await UserLibSqlModel.query().findOne({
    email: normalizedEmail,
  });
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists. Please login or reset your password." },
      { status: 409 },
    );
  }

  const encryptedPassword = await bcrypt.hash(trimmedPassword, 10);
  let createdSqliteUser: UserLibSqlModel | undefined;

  try {
    const [sqliteMax, postgresMax] = await Promise.all([
      UserLibSqlModel.query().max("id as maxId").first(),
      UserPostgresModel.query().max("id as maxId").first(),
    ]);
    const nextId =
      Math.max(
        Number((sqliteMax as { maxId?: number } | undefined)?.maxId || 0),
        Number((postgresMax as { maxId?: number } | undefined)?.maxId || 0),
      ) + 1;

    createdSqliteUser = (await UserLibSqlModel.query().insert({
      id: nextId,
      username: trimmedUsername,
      email: normalizedEmail,
      password: encryptedPassword,
    })) as UserLibSqlModel;

    // Postgres users.password is NOT NULL — keep both stores in sync.
    await UserPostgresModel.query().insert({
      id: createdSqliteUser.id,
      username: createdSqliteUser.username,
      email: createdSqliteUser.email,
      password: encryptedPassword,
    } as Partial<UserPostgresModel>);

    const token = await createSession(createdSqliteUser);

    return NextResponse.json(toPublicUser(createdSqliteUser, token), {
      status: 201,
    });
  } catch (error) {
    if (createdSqliteUser?.id) {
      try {
        await UserLibSqlModel.query().deleteById(createdSqliteUser.id);
      } catch (cleanupError) {
        console.error(
          "Failed to roll back SQLite user after registration error:",
          cleanupError,
        );
      }
    }

    if (isUniqueEmailError(error)) {
      return NextResponse.json(
        {
          message: "User already exists. Please login or reset your password.",
        },
        { status: 409 },
      );
    }

    console.error("Error during user registration:", error);

    return NextResponse.json(
      { message: "An unexpected error occurred during registration." },
      { status: 500 },
    );
  }
}
