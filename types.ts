export interface VnImage {
  id: string;
  url: string;
  dims: [number, number];
  sexual: number;
  violence: number;
  votecount: number;
  thumbnail: string;
  thumbnail_dims: [number, number];
}

export interface TagLink {
  id: string;
  rating: number;
  spoiler: number;
  name: string;
  category: string;
}

export interface Screenshot extends VnImage {
  release: {
    id: string;
    title: string;
  };
}

export interface VnRelation extends VisualNovel {
  relation: string;
  relation_official: boolean;
}

export interface VisualNovel {
  id: string;
  title:string;
  alttitle: string | null;
  image?: VnImage;
  description: string | null;
  rating: number | null;
  votecount: number;
  length_minutes: number | null;
  platforms: string[];
  languages: string[];
  tags: TagLink[];
  screenshots: Screenshot[];
  relations?: VnRelation[];
}

export interface Tag {
  id: string;
  name: string;
  description: string;
  aliases: string[];
  category: 'cont' | 'ero' | 'tech';
  vn_count: number;
}

export interface TraitLink {
  id: string;
  name: string;
  spoiler: number;
  lie: boolean;
  category?: string; // Mapped from group_name
}

export interface CharacterInList {
  id: string;
  name: string;
  image?: VnImage;
  vns: {
    id: string;
    role: 'main' | 'primary' | 'side' | 'appears';
  }[];
}

export interface Character {
  id: string;
  name: string;
  original: string | null;
  aliases: string[];
  description: string | null;
  image?: VnImage;
  blood_type: 'a' | 'b' | 'ab' | 'o' | null;
  height: number | null;
  weight: number | null;
  bust: number | null;
  waist: number | null;
  hips: number | null;
  cup: string | null;
  age: number | null;
  birthday: [number, number] | null;
  sex: [string | null, string | null] | null;
  gender: [string | null, string | null] | null;
  vns: {
    id: string;
    title: string;
    role: 'main' | 'primary' | 'side' | 'appears';
  }[];
  traits: TraitLink[];
}

export type SortOption = 'rating' | 'votecount' | 'released' | 'id';

export interface ApiRequest {
  filters: any[];
  fields: string;
  sort?: SortOption;
  reverse?: boolean;
  results?: number;
  page?: number;
  count?: boolean;
}

export interface ApiResponse<T> {
  results: T[];
  more: boolean;
  count?: number;
}
