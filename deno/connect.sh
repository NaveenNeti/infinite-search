#!/bin/sh

docker exec -it db psql -U deno_user -d deno_db
