
export interface SeoChecklistItem {
  item: string;
  status: 'pass' | 'fail' | 'manual_action';
  details: string;
}

export interface ReadabilityItem {
  criteria: string; // Es: "Parole di transizione", "Forme passive"
  status: 'good' | 'ok' | 'needs_improvement';
  score: string; // Es: "30%", "2 trovate"
  message: string; // Consiglio specifico
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
}

export interface SavedSeoResult extends SeoResult {
    id: string;
    originalArticleText: string;
}
