import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@ai-digest/db";
import { users } from "@ai-digest/db";
import { eq } from "@ai-digest/db";
import { getSession } from "@/lib/session";

const registerSchema = z
  .object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-zA-Z]/, "Password must contain at least one letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validated.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.password, 10);

    const existingUsers = await db.select({ id: users.id }).from(users).limit(1);
    const role = existingUsers.length === 0 ? "admin" : "user";

    const [newUser] = await db
      .insert(users)
      .values({
        email: validated.email,
        passwordHash,
        role,
      })
      .returning({
        id: users.id,
        email: users.email,
        role: users.role,
      });

    if (!newUser) {
      return NextResponse.json(
        { success: false, error: "Failed to create user" },
        { status: 500 }
      );
    }

    const session = await getSession();
    session.userId = newUser.id as string;
    session.email = newUser.email;
    session.role = newUser.role as "user" | "admin";
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json(
      {
        success: true,
        data: {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
