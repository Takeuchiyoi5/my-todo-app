// TODO の API (app/api/todos) と画面 (app/page.tsx) で共有する型・定数・ロジック。
// サーバー専用のもの (Prisma 等) は import しないこと。画面側からも読み込まれる。

export type Priority = 1 | 2 | 3;

export type TodoDto = {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  /** 期限日 "YYYY-MM-DD"。期限なしは null */
  dueDate: string | null;
  priority: Priority;
};

export const DEFAULT_PRIORITY: Priority = 2;

/**
 * 緊急度の表示名と色。ここを書き換えると、アプリ全体の緊急度の色が変わる。
 *
 * Tailwind はソースコード中のクラス名を文字列のまま検出して CSS を生成するため、
 * クラス名は `bg-${color}-500` のように組み立てず、必ず完全な文字列で書くこと。
 */
export const PRIORITY: Record<Priority, { label: string; badgeClass: string }> =
  {
    3: {
      label: "高",
      badgeClass: "border-red-500/40 bg-red-500/15 text-red-300",
    },
    2: {
      label: "中",
      badgeClass: "border-yellow-500/40 bg-yellow-500/15 text-yellow-300",
    },
    1: {
      label: "低",
      badgeClass: "border-zinc-500/40 bg-zinc-500/15 text-zinc-300",
    },
  };

/** select に並べる順 (高 → 低) */
export const PRIORITY_OPTIONS: Priority[] = [3, 2, 1];

export function isPriority(value: unknown): value is Priority {
  return value === 1 || value === 2 || value === 3;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * API で受け取った期限日を検証する。
 * - undefined: 指定なし (変更しない)
 * - null / "": 期限なし
 * - "YYYY-MM-DD": 実在する日付のみ許可
 * 不正な値なら "invalid" を返す。
 */
export function parseDueDate(
  value: unknown,
): string | null | undefined | "invalid" {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) return "invalid";

  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return "invalid";
  }
  return value;
}

/** "YYYY-MM-DD" ⇔ Prisma の @db.Date (UTC 0時の Date) の変換 */
export function dueDateToDb(value: string | null): Date | null {
  return value === null ? null : new Date(`${value}T00:00:00.000Z`);
}

export function toTodoDto(todo: {
  id: string;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
  dueDate: Date | null;
  priority: number;
}): TodoDto {
  return {
    id: todo.id,
    title: todo.title,
    isCompleted: todo.isCompleted,
    createdAt: todo.createdAt.toISOString(),
    dueDate: todo.dueDate ? todo.dueDate.toISOString().slice(0, 10) : null,
    priority: isPriority(todo.priority) ? todo.priority : DEFAULT_PRIORITY,
  };
}

/**
 * 並び順: 期限の早い順 (期限なしは最後) → 緊急度の高い順 → 作成日の新しい順。
 * API (GET /api/todos) の orderBy と同じ順序にしておくこと。
 */
export function compareTodos(a: TodoDto, b: TodoDto): number {
  if (a.dueDate !== b.dueDate) {
    if (a.dueDate === null) return 1;
    if (b.dueDate === null) return -1;
    return a.dueDate < b.dueDate ? -1 : 1;
  }
  if (a.priority !== b.priority) return b.priority - a.priority;
  return b.createdAt.localeCompare(a.createdAt);
}

export type DueStatus = "overdue" | "today" | "soon" | "normal";

/** 何日前から「期限が近い」(黄) 扱いにするか */
const SOON_DAYS = 3;

/** ブラウザの現地日付を基準に、期限の近さを判定する */
export function getDueStatus(
  dueDate: string | null,
  now: Date = new Date(),
): DueStatus {
  if (dueDate === null) return "normal";

  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(`${dueDate}T00:00:00.000Z`).getTime();
  const diffDays = Math.round((due - today) / 86_400_000);

  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= SOON_DAYS) return "soon";
  return "normal";
}

/** 期限日の入力欄に付ける色。緊急度バッジと同じく、ここを書き換えると色が変わる。 */
export const DUE_STATUS_CLASS: Record<DueStatus, string> = {
  overdue: "border-red-500 bg-red-950/60 text-red-200",
  today: "border-orange-500 bg-orange-950/60 text-orange-200",
  soon: "border-yellow-500 bg-yellow-950/50 text-yellow-100",
  normal: "border-zinc-700 bg-zinc-800 text-zinc-300",
};
