import { NotFoundException } from '@nestjs/common';
import { SmeCampaignsService } from './sme-campaigns.service';

describe('SmeCampaignsService', () => {
  const repository = {
    createCampaign: jest.fn(),
    findCampaignByIdForSme: jest.fn(),
    findCreatorSummaryById: jest.fn(),
    addCreatorToCampaign: jest.fn(),
  } as never;

  const service = new SmeCampaignsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates sme campaigns with normalized optional fields', async () => {
    repository.createCampaign.mockResolvedValue({
      id: 3,
      smeUserId: 7,
      name: 'Summer Tech Review',
      description: 'Creator campaign',
      status: 'draft',
      budgetAmount: 2500,
      budgetCurrency: 'USD',
      startsAt: new Date('2026-06-01T00:00:00.000Z'),
      endsAt: null,
      createdAt: new Date('2026-05-21T10:00:00.000Z'),
      updatedAt: new Date('2026-05-21T10:00:00.000Z'),
    });

    const result = await service.createCampaign(
      {
        name: 'Summer Tech Review',
        description: ' Creator campaign ',
        budgetAmount: 2500,
        budgetCurrency: ' USD ',
        startsAt: '2026-06-01T00:00:00.000Z',
      },
      {
        id: 7,
        email: 'sme@example.com',
        role: 'sme',
        tenantId: 1,
        sessionId: 'session-1',
      },
    );

    expect(repository.createCampaign).toHaveBeenCalledWith(
      expect.objectContaining({
        smeUserId: 7,
        description: 'Creator campaign',
        budgetCurrency: 'USD',
      }),
    );
    expect(result.creatorCount).toBe(0);
  });

  it('adds creators to owned campaigns', async () => {
    repository.findCampaignByIdForSme.mockResolvedValue({
      id: 3,
      smeUserId: 7,
    });
    repository.findCreatorSummaryById.mockResolvedValue({
      id: 12,
      role: 'creator',
      displayName: 'Creator Name',
      audienceSize: 120000,
      influenceScore: 75.4,
    });
    repository.addCreatorToCampaign.mockResolvedValue({
      campaignId: 3,
      creatorUserId: 12,
      status: 'shortlisted',
      createdAt: new Date('2026-05-21T10:15:00.000Z'),
    });

    const result = await service.addCreatorToCampaign(
      3,
      { creatorId: 12 },
      {
        id: 7,
        email: 'sme@example.com',
        role: 'sme',
        tenantId: 1,
        sessionId: 'session-1',
      },
    );

    expect(repository.addCreatorToCampaign).toHaveBeenCalledWith({
      campaignId: 3,
      creatorUserId: 12,
      status: 'shortlisted',
    });
    expect(result.displayName).toBe('Creator Name');
  });

  it('throws when campaign is missing', async () => {
    repository.findCampaignByIdForSme.mockResolvedValue(null);
    repository.findCreatorSummaryById.mockResolvedValue({
      id: 12,
      role: 'creator',
      displayName: 'Creator Name',
      audienceSize: 120000,
      influenceScore: 75.4,
    });

    await expect(
      service.addCreatorToCampaign(
        99,
        { creatorId: 12 },
        {
          id: 7,
          email: 'sme@example.com',
          role: 'sme',
          tenantId: 1,
          sessionId: 'session-1',
        },
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
