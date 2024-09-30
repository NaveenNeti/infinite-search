// utils/db.ts

import { config, PgClient } from "../deps.ts";

const env = config();

const client = new PgClient({
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
  hostname: env.DB_HOST, // Use the service name defined in your Docker Compose file
  port: 5432,     // PostgreSQL default port
});

await client.connect();

export default client;
