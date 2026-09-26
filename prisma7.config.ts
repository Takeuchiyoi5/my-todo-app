import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // ここは Prisma CLI (db push / migrate / db pull) 専用の接続。
    // Prisma 7.10 で datasource.directUrl は削除されたため、
    // 直接接続 (port 5432) の DIRECT_URL をここに指定して
    // PgBouncer (port 6543) を経由しないようにする。
    //
    // アプリ実行時 (PrismaClient) はドライバアダプタに
    // DATABASE_URL (プーラ経由 / port 6543) を渡す。
    url: process.env["DIRECT_URL"],
  },
});
