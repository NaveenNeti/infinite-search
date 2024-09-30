// models/article.ts

export interface Article {
    id: number;
    title: string;
    content: string;
    created_at: string; // ISO string
    popularity: number;
  }
  