export interface SeoChecklistItem {
  item: string;
  status: 'pass' | 'fail' | 'manual_action';
  details: string;
}

export interface SeoResult {
  keyPhrase: string;
  title: string;
  description: string;
  slug: string;
  htmlContent: string;
  seoChecklist: SeoChecklistItem[];
  tags: string;
  categories: string;
  socialMediaPost: string;
}

export interface SavedSeoResult extends SeoResult {
    id: string;
    originalArticleText: string;
}
