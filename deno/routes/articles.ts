// routes/articles.ts

import { Router, Context } from "../deps.ts";
import db from "../utils/db.ts";
import esClient from "../utils/elastic.ts";
import { Article } from "../models/article.ts";
import type { SearchRequest } from "https://deno.land/x/elasticsearch@v8.6.0/mod.ts";

const router = new Router();

// Helper function to initialize Elasticsearch index
async function initializeEsIndex() {
  const exists = await esClient.indices.exists({ target: "articles" });
  if (!exists) {
    await esClient.indices.create({
      index: "articles",
      body: {
        mappings: {
          properties: {
            id: { type: "integer" },
            title: { type: "text" },
            content: { type: "text" },
            created_at: { type: "date" },
            popularity: { type: "integer" },
          },
        },
      },
    });
    console.log("Elasticsearch index 'articles' created.");
  } else {
    console.log("Elasticsearch index 'articles' already exists.");
  }
}

router.post("/init", async (ctx: Context) => {
  await initializeEsIndex();

  ctx.response.status = 200;
  ctx.response.body = { message: "Done" };
});

// Endpoint to create an article
router.post("/articles", async (ctx: Context) => {
  const body = await ctx.request.body({ type: "json" });
  const { title, content, popularity } = await body.value;


  if (!title || !content) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Title and content are required." };
    return;
  }

  const result = await db.queryObject<{ id: number }>(
    "INSERT INTO articles (title, content, popularity) VALUES ($1, $2, $3) RETURNING id",
    [title as string,
    content as string,
    typeof popularity === 'number' && !isNaN(popularity) ? popularity : 0]
  );

  const articleId = result.rows[0].id;

  // Fetch the newly created article
  const articleResult = await db.queryObject<Article>(
    "SELECT * FROM articles WHERE id = $1",
    [articleId],
  );

  const article = articleResult.rows[0];

  // Index the article in Elasticsearch
  await esClient.documents.index({
    target: "articles",
    _id: article.id.toString(),
    body: {
      id: article.id,
      title: article.title,
      content: article.content,
      created_at: article.created_at,
      popularity: article.popularity,
    },
    queryParams: {},
  });

  ctx.response.status = 201;
  ctx.response.body = article;
});

// Endpoint to list articles with cursor-based pagination and sorting
router.get("/articles", async (ctx: Context) => {
  const params = ctx.request.url.searchParams;

  const sortField = params.get("sort") || "created_at"; // Default sort field
  const sortOrder = params.get("order") || "asc"; // 'asc' or 'desc'
  const limit = parseInt(params.get("limit") || "20");
  const cursor = params.get("cursor"); // e.g., last_seen_id or last_seen_sort_value

  // Validate sortField
  const validSortFields = ["created_at", "popularity", "title"];
  if (!validSortFields.includes(sortField)) {
    ctx.response.status = 400;
    ctx.response.body = { error: `Invalid sort field. Must be one of ${validSortFields.join(", ")}` };
    return;
  }

  // Validate sortOrder
  if (!["asc", "desc"].includes(sortOrder)) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid sort order. Must be 'asc' or 'desc'." };
    return;
  }

  // Build Elasticsearch query
  const esQuery: any = {
    bool: {
      must: [],
      filter: [],
    },
  };

  if (cursor) {
    // Assuming cursor is the value of the sort field from the last item
    const comparison = sortOrder === "asc" ? "gt" : "lt";
    esQuery.bool.filter.push({
      range: {
        [sortField]: {
          [comparison]: cursor,
        },
      },
    });
  }

  const searchParams: SearchRequest = {
    target: "articles",
    body: {
      query: esQuery,
      sort: [
        { [sortField]: sortOrder },
        { id: "asc" }, // Secondary sort to ensure consistent ordering
      ],
      size: limit,
      _source: false, // We only need IDs to fetch detailed data from PostgreSQL
    },
  };

  try {
    const esResponse = await esClient.search(searchParams);

    const hits = esResponse.hits.hits;

    if (hits.length === 0) {
      ctx.response.status = 200;
      ctx.response.body = {
        articles: [],
        next_cursor: null,
      };
      return;
    }

    const articleIds = hits.map((hit: any) => parseInt(hit._id));

    // Fetch detailed data from PostgreSQL
    const placeholders = articleIds.map((_, i) => `$${i + 1}`).join(", ");
    const sql = `SELECT * FROM articles WHERE id IN (${placeholders}) ORDER BY ${sortField} ${sortOrder}, id ASC`;

    const articlesResult = await db.queryObject<Article>(sql, [...articleIds]);
    const articles = articlesResult.rows;

    // Determine next cursor
    const lastArticle = articles[articles.length - 1];
    // @ts-ignore
    const next_cursor = lastArticle ? lastArticle[sortField] : null;

    const response = {
      articles,
      next_cursor,
    };

    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    console.error("Error querying Elasticsearch:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error." };
  }
});

export default router;
