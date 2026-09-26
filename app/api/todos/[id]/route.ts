import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  dueDateToDb,
  isPriority,
  parseDueDate,
  toTodoDto,
  type Priority,
  type TodoDto,
} from "@/lib/todos";
import type { ErrorResponse } from "../route";

/** 指定したフィールドだけを更新する (最低 1 つ必須) */
export type UpdateTodoRequestBody = {
  isCompleted?: boolean;
  dueDate?: string | null;
  priority?: Priority;
};
export type UpdateTodoResponse = { todo: TodoDto };
export type DeleteTodoResponse = { success: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
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

  const data: { isCompleted?: boolean; dueDate?: Date | null; priority?: Priority } =
    {};

  if (body.isCompleted !== undefined) {
    if (typeof body.isCompleted !== "boolean") {
      return NextResponse.json<ErrorResponse>(
        { error: "isCompleted は真偽値で指定してください。" },
        { status: 400 },
      );
    }
    data.isCompleted = body.isCompleted;
  }

  const dueDate = parseDueDate(body.dueDate);
  if (dueDate === "invalid") {
    return NextResponse.json<ErrorResponse>(
      { error: "期限日の形式が正しくありません。" },
      { status: 400 },
    );
  }
  if (dueDate !== undefined) {
    data.dueDate = dueDateToDb(dueDate);
  }

  if (body.priority !== undefined) {
    if (!isPriority(body.priority)) {
      return NextResponse.json<ErrorResponse>(
        { error: "緊急度は 1〜3 で指定してください。" },
        { status: 400 },
      );
    }
    data.priority = body.priority;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json<ErrorResponse>(
      { error: "更新する項目を指定してください。" },
      { status: 400 },
    );
  }

  // updateMany + userId 条件で「他人の TODO を更新できない」ことを保証する。
  // Prisma は Supabase の RLS をすり抜けるため、この絞り込みが実質的な防御線になる。
  const { count } = await prisma.todo.updateMany({
    where: { id, userId: user.id },
    data,
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
