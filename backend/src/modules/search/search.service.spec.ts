import { SearchService } from './search.service';
import type { SearchRepository } from './search.repository';
import type { SearchCacheService } from './search-cache.service';

describe('SearchService', () => {
  const repository = {
    searchCreators: jest.fn(),
  } as unknown as SearchRepository;

  const cache = {
    getCreators: jest.fn(),
    setCreators: jest.fn(),
  } as unknown as SearchCacheService;

  const service = new SearchService(repository, cache);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('routes short queries to name search', async () => {
    cache.getCreators.mockResolvedValue(null);
    repository.searchCreators.mockResolvedValue([]);

    await service.searchCreators({ query: 'gaming', limit: 10 });

    expect(repository.searchCreators).toHaveBeenCalledWith({
      query: 'gaming',
      limit: 10,
      mode: 'name',
    });
  });

  it('routes long multi-token queries to bio search', async () => {
    cache.getCreators.mockResolvedValue(null);
    repository.searchCreators.mockResolvedValue([]);

    await service.searchCreators({
      query: 'creator focused on long-form gaming reviews',
      limit: 10,
    });

    expect(repository.searchCreators).toHaveBeenCalledWith({
      query: 'creator focused on long-form gaming reviews',
      limit: 10,
      mode: 'bio',
    });
  });

  it('caps limit at 50', async () => {
    cache.getCreators.mockResolvedValue(null);
    repository.searchCreators.mockResolvedValue([]);

    await service.searchCreators({ query: 'gaming', limit: 500 });

    expect(repository.searchCreators).toHaveBeenCalledWith({
      query: 'gaming',
      limit: 50,
      mode: 'name',
    });
  });

  it('returns cached results when available', async () => {
    const cached = {
      creators: [],
      limit: 10,
    };

    cache.getCreators.mockResolvedValue(cached);

    const result = await service.searchCreators({ query: 'gaming', limit: 10 });

    expect(result).toEqual(cached);
    expect(repository.searchCreators).not.toHaveBeenCalled();
  });
});
