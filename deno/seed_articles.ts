// seed_articles.ts

// Import necessary modules from Deno standard library
import { delay } from "https://deno.land/std@0.203.0/async/mod.ts";

// Configuration Constants
const API_URL = Deno.env.get("API_URL") || "http://localhost:8000/articles"; // API endpoint
const TOTAL_ARTICLES = 10000; // Total number of articles to seed
const CONCURRENT_REQUESTS = 100; // Number of concurrent POST requests

// Utility Functions

/**
 * Generates a unique title for an article based on its index.
 * @param index - The index number of the article.
 * @returns A string representing the article title.
 */
function generateTitle(index: number): string {
  return `Sample Article Title ${index}`;
}

/**
 * Generates content for an article based on its index.
 * @param index - The index number of the article.
 * @returns A string representing the article content.
 */
function generateContent(index: number): string {
  return `This is the content of sample article number ${index}. It provides valuable insights and information on various topics related to your application.`;
}

/**
 * Generates a random popularity score for an article.
 * @returns An integer representing the article's popularity.
 */
function generatePopularity(): number {
  return Math.floor(Math.random() * 100); // Random popularity between 0 and 99
}

/**
 * Creates a single article by sending a POST request to the API.
 * @param index - The index number of the article.
 * @returns A promise that resolves when the article is created.
 */
async function createArticle(index: number): Promise<void> {
  const article = {
    title: generateTitle(index),
    content: generateContent(index),
    popularity: generatePopularity(),
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(article),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to create article ${index}: ${response.status} - ${errorText}`);
    } else {
      console.log(`✅ Successfully created article ${index}`);
    }
  } catch (error) {
    console.error(`⚠️ Error creating article ${index}:`, error);
  }
}

/**
 * Seeds the articles by creating them in batches with controlled concurrency.
 */
async function seedArticles() {
  console.log(`🚀 Starting to seed ${TOTAL_ARTICLES} articles...`);

  let currentIndex = 1;
  let completed = 0;

  // Function to process a single batch
  const processBatch = async () => {
    while (currentIndex <= TOTAL_ARTICLES) {
      const index = currentIndex++;
      createArticle(index).then(() => {
        completed++;
        if (completed % 1000 === 0) {
          console.log(`🟢 ${completed} articles created so far...`);
        }
      });
    }
  };

  // Start concurrent workers
  const workers = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    workers.push(processBatch());
  }

  // Wait for all workers to finish
  await Promise.all(workers);

  // Wait a bit to ensure all logs are printed
  await delay(5000);

  console.log(`🎉 Seeding completed. Total articles created: ${completed}`);
}

// Execute the seeding process
seedArticles();
