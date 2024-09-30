# Running instructions

```
clean.sh
docker compose up -d --build
```

# Seeding

```
deno run --allow-env --allow-net seed_articles.ts
```

# Extract with Sort

```
GET http://localhost:8000/articles?sort=popularity&order=desc&limit=50&cursor=55
```