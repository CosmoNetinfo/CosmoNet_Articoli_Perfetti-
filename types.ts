
export interface SeoChecklistItem {
  item: string;
  status: 'pass' | 'fail' | 'manual_action';
  details: string;
}

export interface ReadabilityItem {
  criteria: string; 
  status: 'good' | 'ok' | 'needs_improvement';
  score: string; 
  message: string; 
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface SeoResult {
  keyPhrase: string;
  title: string;
  description: string;
  slug: string;
  htmlContent: string;
  seoChecklist: SeoChecklistItem[];
  readability: ReadabilityItem[];
  tags: string;
  categories: string;
  socialMediaPost: string;
  groundingSources?: GroundingSource[];
}

export interface SavedSeoResult extends SeoResult {
    id: string;
    originalArticleText: string;
}
