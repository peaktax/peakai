
export enum TaxCategory {
  INDIVIDUAL = 'Individual',
  BUSINESS = 'Business',
}

export interface Citation {
  title: string;
  uri: string;
  source: string;
}

export interface SearchResult {
  text: string;
  citations: Citation[];
}

export interface UploadedFile {
  name: string;
  mimeType: string;
  data: string; // Base64 string
}

export interface ImageIdea {
  description: string;
  prompt: string; // For AI image generators
  altText: string; // For SEO
}

export interface SocialPosts {
  linkedin: string;
  twitter: string;
}

export interface RelatedTopic {
  title: string;
  slug: string;
  url: string;
}

export interface SEOMetadata {
  metaTitle: string;
  metaDescription: string;
  slug: string;
  schemaJSON: string; // JSON-LD string
  socialMetaTags: string; // HTML meta tags for Open Graph/Twitter
  imageIdeas: ImageIdea[];
  socialPosts: SocialPosts;
  relatedTopics: RelatedTopic[];
}

export interface AuthorProfile {
  name: string;
  credentials: string; // e.g., "CPA, MST" or "Senior Tax Editor"
  bio: string;
}

export interface BlogState {
  category: TaxCategory;
  topic: string;
  author: AuthorProfile;
  status: 'idle' | 'researching' | 'thinking' | 'complete' | 'error';
  researchData?: SearchResult;
  blogContent?: string;
  error?: string;
  files?: UploadedFile[];
  keywords?: string[];
  seoMetadata?: SEOMetadata;
}

export interface HistoryItem {
  id: string;
  date: number;
  category: TaxCategory;
  topic: string;
  author: AuthorProfile;
  researchData: SearchResult;
  blogContent: string;
  seoMetadata: SEOMetadata;
  keywords: string[];
}