import { CreatorDiscoveryService } from './creator-discovery.service';

describe('CreatorDiscoveryService', () => {
  const repository = {
    searchCreators: jest.fn(),
    getCreatorsByIds: jest.fn(),
    getScoutedCreatorsForSme: jest.fn(),
    findCreatorById: jest.fn(),
    scoutCreator: jest.fn(),
    unscoutCreator: jest.fn(),
  } as never;

  const cache = {
    get: jest.fn(),
    set: jest.fn(),
    getProfile: jest.fn(),
    setProfile: jest.fn(),
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

  it('returns scouted creators for the authenticated sme', async () => {
    const rows = [
      {
        userId: 12,
        displayName: 'Creator Name',
        status: 'scouted',
        audienceSize: 120000,
        influenceScore: 75.4,
        category: 'gaming',
      },
    ];

    repository.getScoutedCreatorsForSme.mockResolvedValue(rows);

    const result = await service.getScoutedCreators({
      id: 9,
      email: 'sme@example.com',
      role: 'sme',
      tenantId: 1,
      sessionId: 'session-1',
    });

    expect(repository.getScoutedCreatorsForSme).toHaveBeenCalledWith(9);
    expect(result).toEqual({ creators: rows });
  });

  it('scouts valid creators for the authenticated sme', async () => {
    repository.findCreatorById.mockResolvedValue({
      userId: 12,
      role: 'creator',
    });

    const result = await service.scoutCreator(12, {
      id: 9,
      email: 'sme@example.com',
      role: 'sme',
      tenantId: 1,
      sessionId: 'session-1',
    });

    expect(repository.scoutCreator).toHaveBeenCalledWith(9, 12);
    expect(result).toEqual({ success: true });
  });
});
