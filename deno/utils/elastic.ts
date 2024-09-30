// utils/elastic.ts

import { ElasticsearchClient as EsClient } from "../deps.ts";
import { config } from "../deps.ts";

const env = config();

const esClient = new EsClient({ node: env.ELASTICSEARCH_URL });

export default esClient;
