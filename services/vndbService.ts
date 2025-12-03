import { ApiRequest, ApiResponse, VisualNovel, Tag, SortOption, CharacterInList, Character } from '../types';

const API_ENDPOINT = 'https://api.vndb.org/kana';

async function callVndbApi<T>(endpoint: string, body: ApiRequest): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_ENDPOINT}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling VNDB API:', error);
    throw error;
  }
}

export const searchVns = async (
  query: string,
  tags: Tag[],
  sort: SortOption,
  page: number,
  resultsPerPage: number
): Promise<ApiResponse<VisualNovel>> => {
  
  const filters: any[] = [];
  if (query) {
    filters.push(['search', '=', query]);
  }
  if (tags.length > 0) {
    const tagFilters = tags.map(tag => ['tag', '=', tag.id]);
    if (tagFilters.length === 1) {
        filters.push(tagFilters[0]);
    } else {
        filters.push(['and', ...tagFilters]);
    }
  }

  const requestBody: ApiRequest = {
    filters: filters.length > 1 ? ['and', ...filters] : (filters.length === 1 ? filters[0] : []),
    fields: 'id, title, image.url, rating, votecount, length_minutes',
    sort: sort,
    reverse: sort === 'id' ? false : true,
    page: page,
    results: resultsPerPage,
    count: true,
  };

  return callVndbApi<VisualNovel>('vn', requestBody);
};

export const getVnById = async (id: string): Promise<VisualNovel | null> => {
  const requestBody: ApiRequest = {
    filters: ['id', '=', id],
    fields: 'id, title, alttitle, image{url,dims,sexual,violence,thumbnail}, description, rating, votecount, length_minutes, platforms, languages, tags{id,name,rating,spoiler,category}, screenshots{url,thumbnail,release{id,title}}, relations{id,title,image.url,rating,votecount,relation,relation_official}',
  };

  const response = await callVndbApi<VisualNovel>('vn', requestBody);
  return response.results.length > 0 ? response.results[0] : null;
};

export const getVnsByIds = async (ids: string[]): Promise<VisualNovel[]> => {
  if (ids.length === 0) return [];

  const idFilters = ids.map(id => ['id', '=', id]);
  const filters = idFilters.length > 1 ? ['or', ...idFilters] : idFilters[0];

  const requestBody: ApiRequest = {
    filters,
    fields: 'id, title, image.url, rating, votecount',
    results: ids.length,
    sort: 'votecount',
    reverse: true,
  };

  const response = await callVndbApi<VisualNovel>('vn', requestBody);
  return response.results;
};

export const getCharactersByVnId = async (vnId: string): Promise<CharacterInList[]> => {
  const requestBody: ApiRequest = {
    filters: ['vn', '=', ['id', '=', vnId]],
    fields: 'id, name, image.url, vns{id, role}',
    results: 100, // Max results per page
  };
  const response = await callVndbApi<CharacterInList>('character', requestBody);
  return response.results;
};


export const getCharacterById = async (id: string): Promise<Character | null> => {
  const requestBody: ApiRequest = {
    filters: ['id', '=', id],
    fields: 'id, name, original, aliases, description, image.url, blood_type, height, weight, bust, waist, hips, cup, age, birthday, sex, gender, vns{id, title, role}, traits{id, name, spoiler, lie, group_name}',
  };
  const response = await callVndbApi<Character>('character', requestBody);
  // Map group_name to category for traits
  if (response.results.length > 0 && response.results[0].traits) {
    response.results[0].traits = response.results[0].traits.map((trait: any) => ({
      ...trait,
      category: trait.group_name || 'general'
    }));
  }
  return response.results.length > 0 ? response.results[0] : null;
};

export const getCharactersByIds = async (ids: string[]): Promise<Character[]> => {
  if (ids.length === 0) return [];

  const idFilters = ids.map(id => ['id', '=', id]);
  const filters = idFilters.length > 1 ? ['or', ...idFilters] : idFilters[0];

  const requestBody: ApiRequest = {
    filters,
    fields: 'id, name, image.url',
    results: ids.length,
  };

  const response = await callVndbApi<Character>('character', requestBody);
  return response.results;
};

export const getBookmarkedIds = async (type: 'vn' | 'char'): Promise<string[]> => {
  const response = await fetch(`/api/bookmarks?type=${type}`);
  if (!response.ok) {
    throw new Error('Failed to fetch bookmarks');
  }
  return response.json();
};

export const addBookmark = async (id: string, type: 'vn' | 'char'): Promise<void> => {
  await fetch(`/api/bookmarks?type=${type}&id=${id}`, { method: 'POST' });
};

export const removeBookmark = async (id: string, type: 'vn' | 'char'): Promise<void> => {
  await fetch(`/api/bookmarks?type=${type}&id=${id}`, { method: 'DELETE' });
};

export const searchTags = async (query: string): Promise<Tag[]> => {
  if (!query || query.length < 2) {
    return [];
  }
  const requestBody: ApiRequest = {
    filters: ['search', '=', query],
    fields: 'id, name, aliases, description, category',
    results: 10,
  };
  const response = await callVndbApi<Tag>('tag', requestBody);
  return response.results;
};

export const getTagsByIds = async (ids: string[]): Promise<Tag[]> => {
    if (ids.length === 0) return [];

    const idFilters = ids.map(id => ['id', '=', id]);
    const filters = idFilters.length > 1 ? ['or', ...idFilters] : idFilters[0];

    const requestBody: ApiRequest = {
        filters,
        fields: 'id, name, aliases, description, category',
        results: ids.length,
    };

    const response = await callVndbApi<Tag>('tag', requestBody);
    return response.results;
};
