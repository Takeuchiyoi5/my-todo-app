"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type {
  CreateTodoRequestBody,
  CreateTodoResponse,
  ErrorResponse,
  GetTodosResponse,
  TodoDto,
} from "@/app/api/todos/route";
import type {
  UpdateTodoRequestBody,
  UpdateTodoResponse,
} from "@/app/api/todos/[id]/route";

export default function Home() {
  const router = useRouter();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoDto[]>([]);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // proxy.ts がサーバー側でルートを保護しているが、page.tsx はクライアント
  // コンポーネントのためサーバー側でセッション確認ができない。ここではクライアント
  // 側の Supabase セッションからメールアドレスを取得しつつ、多層防御として
  // 未ログインなら /login へ逃がす。
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserEmail(user.email ?? null);
    });
  }, [router]);

  useEffect(() => {
    async function loadTodos() {
      setIsLoadingTodos(true);
      setListError(null);
      try {
        const res = await fetch("/api/todos");
        if (!res.ok) {
          const body: ErrorResponse = await res.json();
          throw new Error(body.error);
        }
        const body: GetTodosResponse = await res.json();
        setTodos(body.todos);
      } catch (error) {
        setListError(
          error instanceof Error
            ? error.message
            : "TODO の取得に失敗しました。",
        );
      } finally {
        setIsLoadingTodos(false);
      }
    }

    loadTodos();
  }, []);

  async function handleAddTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const title = newTitle.trim();
    if (!title) {
      setFormError("タイトルを入力してください。");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title } satisfies CreateTodoRequestBody),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.error);
      }

      const body: CreateTodoResponse = await res.json();
      setTodos((prev) => [body.todo, ...prev]);
      setNewTitle("");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "追加に失敗しました。",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleTodo(id: string, isCompleted: boolean) {
    const previousTodos = todos;
    // 楽観的更新: 先に画面を更新し、失敗したら元に戻す
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, isCompleted } : todo)),
    );
    setListError(null);

    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCompleted } satisfies UpdateTodoRequestBody),
      });

      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.error);
      }

      const body: UpdateTodoResponse = await res.json();
      setTodos((prev) =>
        prev.map((todo) => (todo.id === id ? body.todo : todo)),
      );
    } catch (error) {
      setTodos(previousTodos);
      setListError(
        error instanceof Error ? error.message : "更新に失敗しました。",
      );
    }
  }

  async function handleDeleteTodo(id: string) {
    const previousTodos = todos;
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
    setListError(null);

    try {
      const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });

      if (!res.ok) {
        const body: ErrorResponse = await res.json();
        throw new Error(body.error);
      }
    } catch (error) {
      setTodos(previousTodos);
      setListError(
        error instanceof Error ? error.message : "削除に失敗しました。",
      );
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-zinc-50">
      <header className="flex items-center justify-between gap-4 border-b border-zinc-800 px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold">My TODO App</h1>
        <div className="flex min-w-0 items-center gap-3">
          <span className="hidden truncate text-sm text-zinc-400 sm:inline max-w-[16rem]">
            {userEmail}
          </span>
          <SignOutButton />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl shadow-black/40 sm:p-8">
          <span className="block truncate text-sm text-zinc-400 sm:hidden">
            {userEmail}
          </span>

          <form
            onSubmit={handleAddTodo}
            className="mt-2 flex flex-col gap-2 sm:flex-row sm:mt-0"
          >
            <input
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="新しい TODO を入力"
              className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-zinc-50 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "追加中..." : "追加"}
            </button>
          </form>

          {formError && (
            <p className="mt-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {formError}
            </p>
          )}

          {listError && (
            <p className="mt-3 rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {listError}
            </p>
          )}

          <ul className="mt-6">
            {isLoadingTodos ? (
              <li className="py-6 text-center text-sm text-zinc-500">
                読み込み中...
              </li>
            ) : todos.length === 0 ? (
              <li className="py-6 text-center text-sm text-zinc-500">
                TODO はまだありません。
              </li>
            ) : (
              todos.map((todo) => (
                <li
                  key={todo.id}
                  className="flex items-center gap-3 border-b border-zinc-800 py-3 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={todo.isCompleted}
                    onChange={(event) =>
                      handleToggleTodo(todo.id, event.target.checked)
                    }
                    className="h-5 w-5 shrink-0 rounded border-zinc-600 bg-zinc-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span
                    className={
                      todo.isCompleted
                        ? "flex-1 min-w-0 break-words text-zinc-500 line-through"
                        : "flex-1 min-w-0 break-words text-zinc-100"
                    }
                  >
                    {todo.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteTodo(todo.id)}
                    className="shrink-0 text-sm text-red-400 transition-colors hover:text-red-300"
                  >
                    削除
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
