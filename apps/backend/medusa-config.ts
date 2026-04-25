import { loadEnv, defineConfig } from "@medusajs/framework/utils";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

const trimTrailingSlash = (url?: string) => url?.trim().replace(/\/+$/, "");

const backendUrl = trimTrailingSlash(process.env.MEDUSA_BACKEND_URL);
const fileBackendUrl =
  trimTrailingSlash(process.env.MEDUSA_FILE_BACKEND_URL) ||
  (backendUrl ? `${backendUrl}/static` : undefined);

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,

    databaseDriverOptions: {
      ssl: false,
      sslmode: "disable",
    },

    redisUrl: process.env.REDIS_URL,

    workerMode: process.env.MEDUSA_WORKER_MODE as
      | "shared"
      | "worker"
      | "server",

    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },

  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",

    // URL самого Medusa backend/Admin
    backendUrl,

    // URL storefront. Используется в ссылках из Admin на витрину
    storefrontUrl: process.env.MEDUSA_STOREFRONT_URL,
  },

  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-local",
            id: "local",
            options: {
              backend_url: fileBackendUrl,
            },
          },
        ],
      },
    },
  ],
});
