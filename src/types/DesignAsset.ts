export type Category = 'architecture' | 'graphic' | 'industrial' | 'interior' | 'fashion';
export type Authority = 'wiki' | 'unesco' | 'museum';
export type VisitType = 'physical' | 'virtual' | 'both';

export interface DesignAsset {
  id: string;
  name: string;
  nameLocal: string;
  nameZh: string;
  country: string;
  countryCode: string;
  city: string;
  category: Category;
  year: number | null;
  yearEnd?: number;
  yearCirca: boolean;
  description: string;
  descriptionZh: string;
  latitude: number;
  longitude: number;
  imageUrl: string;
  sourceUrl: string;
  authority: Authority;
  visitType: VisitType;
  tags: string[];
  isDisputed: boolean;
  disputedNote?: string;
  isEndangered: boolean;
  extinctionNote?: string;
  createdAt: string;
}
