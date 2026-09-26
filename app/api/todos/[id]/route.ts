import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { ErrorResponse, TodoDto } from "../route";

export type UpdateTodoRequestBody = { isCompleted: boolean };
export type UpdateTodoResponse = { todo: TodoDto };
export type DeleteTodoResponse = { success: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

function toTodoDto(todo: {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
}): TodoDto {
  return {
    id: todo.id,
    title: todo.title,
    isCompleted: todo.isCompleted,
    createdAt: todo.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です。" },
      { status: 401 },
    );
  }

  const { id } = await params;

  let body: UpdateTodoRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  if (typeof body.isCompleted !== "boolean") {
    return NextResponse.json<ErrorResponse>(
      { error: "isCompleted は真偽値で指定してください。" },
      { status: 400 },
    );
  }

  // updateMany + userId 条件で「他人の TODO を更新できない」ことを保証する。
  // Prisma は Supabase の RLS をすり抜けるため、この絞り込みが実質的な防御線になる。
  const { count } = await prisma.todo.updateMany({
    where: { id, userId: user.id },
    data: { isCompleted: body.isCompleted },
  });

  if (count === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "TODO が見つかりません。" },
      { status: 404 },
    );
  }

  const todo = await prisma.todo.findFirst({
    where: { id, userId: user.id },
  });

  if (!todo) {
    return NextResponse.json<ErrorResponse>(
      { error: "TODO が見つかりません。" },
      { status: 404 },
    );
  }

  return NextResponse.json<UpdateTodoResponse>({ todo: toTodoDto(todo) });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です。" },
      { status: 401 },
    );
  }

  const { id } = await params;

  const { count } = await prisma.todo.deleteMany({
    where: { id, userId: user.id },
  });

  if (count === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "TODO が見つかりません。" },
      { status: 404 },
    );
  }

  return NextResponse.json<DeleteTodoResponse>({ success: true });
}
