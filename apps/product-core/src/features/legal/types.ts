export type LegalBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'subheading'; text: string };

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  title: string;
  effectiveDate: string;
  version: string;
  operatorLines?: string[];
  intro?: LegalBlock[];
  sections: LegalSection[];
  note?: string;
}

export type LegalDocByLocale = Record<'en' | 'ru' | 'uk', LegalDoc>;
