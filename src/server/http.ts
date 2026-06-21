import express, { type Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authRoutes } from "./api/authRoutes";
import { dataRoutes } from "./api/dataRoutes";
import { userFromCookieHeader } from "./auth/jwt";
import { isProd } from "./config";
import {
  composeHtml,
  loadInitialData,
  type InitialState,
  type RenderFn,
} from "./ssr";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");

export async function createApp(): Promise<Express> {
  const app = express();
  app.use(express.json());

  // JSON API — must be registered before the SSR catch-all.
  app.use("/api/auth", authRoutes);
  app.use("/api", dataRoutes);

  if (!isProd) {
    await mountDev(app);
  } else {
    await mountProd(app);
  }

  return app;
}

// ---- Development: Vite middleware + on-the-fly SSR ----
async function mountDev(app: Express): Promise<void> {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    root: rootDir,
    appType: "custom",
    server: { middlewareMode: true },
  });
  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const templateRaw = fs.readFileSync(
        path.resolve(rootDir, "index.html"),
        "utf-8",
      );
      const template = await vite.transformIndexHtml(url, templateRaw);
      const { render } = (await vite.ssrLoadModule(
        "/src/client/entry-server.tsx",
      )) as {
        render: RenderFn;
      };
      const html = await renderPage(render, template, req.headers.cookie, url);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      vite.ssrFixStacktrace(err as Error);
      next(err);
    }
  });
}

// ---- Production: static assets + prebuilt SSR bundle ----
async function mountProd(app: Express): Promise<void> {
  const clientDir = path.resolve(rootDir, "dist/client");
  const template = fs.readFileSync(
    path.resolve(clientDir, "index.html"),
    "utf-8",
  );
  const { render } = (await import(
    path.resolve(rootDir, "dist/server-entry/entry-server.mjs")
  )) as { render: RenderFn };

  // Hashed assets are immutable.
  app.use(
    express.static(clientDir, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      },
    }),
  );

  app.use("*", async (req, res, next) => {
    try {
      const html = await renderPage(
        render,
        template,
        req.headers.cookie,
        req.originalUrl,
      );
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (err) {
      next(err);
    }
  });
}

async function renderPage(
  render: RenderFn,
  template: string,
  cookieHeader: string | undefined,
  url: string,
): Promise<string> {
  const user = userFromCookieHeader(cookieHeader);
  const data = await loadInitialData(url);
  const state: InitialState = { user, url, data };
  const rendered = render(url, state);
  return composeHtml(template, rendered, state);
}
