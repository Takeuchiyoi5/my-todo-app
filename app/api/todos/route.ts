import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  DEFAULT_PRIORITY,
  dueDateToDb,
  isPriority,
  parseDueDate,
  toTodoDto,
  type Priority,
  type TodoDto,
} from "@/lib/todos";

// --- 画面 (app/page.tsx) と共有する型 ------------------------------------
// Prisma の Todo をそのまま返すと Date 型などが JSON 化で string になり型が
// ズレるため、レスポンス用の DTO (lib/todos.ts) を返す。

export type { TodoDto };

export type ErrorResponse = { error: string };

export type GetTodosResponse = { todos: TodoDto[] };

export type CreateTodoRequestBody = {
  title: string;
  dueDate?: string | null;
  priority?: Priority;
};
export type CreateTodoResponse = { todo: TodoDto };

const TITLE_MAX_LENGTH = 200;

/**
 * ログイン中のユーザーを確認する。
 * DB クエリ自体は supabase-js を使わず Prisma で行うが、
 * 「誰がログインしているか」の確認はセッション Cookie を持つ supabase-js に任せる。
 */
async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です。" },
      { status: 401 },
    );
  }

  // lib/todos.ts の compareTodos と同じ並び順にすること
  const todos = await prisma.todo.findMany({
    where: { userId: user.id },
    orderBy: [
      { dueDate: { sort: "asc", nulls: "last" } },
      { priority: "desc" },
      { createdAt: "desc" },
    ],
  });

  return NextResponse.json<GetTodosResponse>({
    todos: todos.map(toTodoDto),
  });
}

export async function POST(request: NextRequest) {
  const user = await requireUser();
  if (!user) {
    return NextResponse.json<ErrorResponse>(
      { error: "ログインが必要です。" },
      { status: 401 },
    );
  }

  let body: CreateTodoRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorResponse>(
      { error: "リクエストの形式が正しくありません。" },
      { status: 400 },
    );
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";

  if (!title) {
    return NextResponse.json<ErrorResponse>(
      { error: "タイトルを入力してください。" },
      { status: 400 },
    );
  }

  if (title.length > TITLE_MAX_LENGTH) {
    return NextResponse.json<ErrorResponse>(
      { error: `タイトルは${TITLE_MAX_LENGTH}文字以内で入力してください。` },
      { status: 400 },
    );
  }

  const dueDate = parseDueDate(body.dueDate);
  if (dueDate === "invalid") {
    return NextResponse.json<ErrorResponse>(
      { error: "期限日の形式が正しくありません。" },
      { status: 400 },
    );
  }

  if (body.priority !== undefined && !isPriority(body.priority)) {
    return NextResponse.json<ErrorResponse>(
      { error: "緊急度は 1〜3 で指定してください。" },
      { status: 400 },
    );
  }

  const todo = await prisma.todo.create({
    data: {
      userId: user.id,
      title,
      dueDate: dueDateToDb(dueDate ?? null),
      priority: body.priority ?? DEFAULT_PRIORITY,
    },
  });

  return NextResponse.json<CreateTodoResponse>(
    { todo: toTodoDto(todo) },
    { status: 201 },
  );
}
