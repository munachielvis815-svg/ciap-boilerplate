import { CreatorDiscoveryService } from './creator-discovery.service';

describe('CreatorDiscoveryService', () => {
  const repository = {
    searchCreators: jest.fn(),
    getCreatorsByIds: jest.fn(),
  } as never;

  const cache = {
    get: jest.fn(),
    set: jest.fn(),
  } as never;

  const service = new CreatorDiscoveryService(repository, cache);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns cached search results when available', async () => {
    const cachedResponse = {
      creators: [],
      limit: 10,
      offset: 0,
    };

    cache.get.mockResolvedValue(cachedResponse);

    const result = await service.searchCreators({
      query: 'gaming',
      platform: 'youtube',
      minInfluenceScore: 10,
      maxInfluenceScore: 90,
      limit: 10,
      offset: 0,
    });

    expect(result).toEqual(cachedResponse);
    expect(repository.searchCreators).not.toHaveBeenCalled();
  });

  it('queries repository when cache misses', async () => {
    const rows = [
      {
        userId: 12,
        displayName: 'Creator Name',
        bio: 'Gaming creator',
        influenceScore: 75.4,
        audienceSize: 120000,
      },
    ];

    cache.get.mockResolvedValue(null);
    repository.searchCreators.mockResolvedValue(rows);

    const result = await service.searchCreators({
      query: 'gaming',
      platform: 'youtube',
      minInfluenceScore: 10,
      maxInfluenceScore: 90,
      limit: 10,
      offset: 0,
    });

    expect(repository.searchCreators).toHaveBeenCalledWith({
      query: 'gaming',
      platform: 'youtube',
      minInfluenceScore: 10,
      maxInfluenceScore: 90,
      limit: 10,
      offset: 0,
    });
    expect(cache.set).toHaveBeenCalled();
    expect(result).toEqual({
      creators: rows,
      limit: 10,
      offset: 0,
    });
  });

  it('ignores empty bioQuery values when searching creators', async () => {
    cache.get.mockResolvedValue(null);
    repository.searchCreators.mockResolvedValue([]);

    await service.searchCreators({
      query: 'gaming',
      bioQuery: '   ',
      platform: 'youtube',
      minInfluenceScore: 10,
      maxInfluenceScore: 90,
      limit: 10,
      offset: 0,
    });

    expect(repository.searchCreators).toHaveBeenCalledWith({
      query: 'gaming',
      bioQuery: undefined,
      platform: 'youtube',
      minInfluenceScore: 10,
      maxInfluenceScore: 90,
      limit: 10,
      offset: 0,
    });
  });
});
