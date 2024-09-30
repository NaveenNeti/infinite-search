// utils/db.ts

import { PgClient } from "../deps.ts";


const client = new PgClient({
  user: "deno_user",
  password: 'deno_pass',
  database: "deno_db",
  hostname: "localhost",
  port: 5432,
});

await client.connect();

export default client;
