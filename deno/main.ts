// main.ts

import { Application, config } from "./deps.ts";
import router from "./routes/articles.ts";

const env = config();
const PORT = env.PORT || "8000";

const app = new Application();

// Middleware for logging
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.request.method} ${ctx.request.url} - ${ms}ms`);
});

// Middleware for handling errors
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    console.error("Unhandled Error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error." };
  }
});

// Use the router
app.use(router.routes());
app.use(router.allowedMethods());

// Start the server
console.log(`Server is running on port ${PORT}`);
await app.listen({ port: parseInt(PORT) });
