import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isPaymentGroup,
  isPaymentGroupArray,
  fetchPaymentGroups,
  fetchArchivedPaymentGroups,
  fetchPaymentGroup,
  createPaymentGroup,
  updatePaymentGroup,
  deletePaymentGroup,
} from './api';
import { apiJson, apiFetch } from '../../api/client';

vi.mock('../../api/client', () => ({
  apiJson: vi.fn(),
  apiFetch: vi.fn(),
}));

const validPaymentGroup = {
  id: 'id1',
  name: 'Группа',
  sortOrder: 0,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('isPaymentGroup', () => {
  it('returns true for valid PaymentGroup', () => {
    expect(isPaymentGroup(validPaymentGroup)).toBe(true);
  });

  it('returns true for PaymentGroup with optional color and icon', () => {
    expect(
      isPaymentGroup({ ...validPaymentGroup, color: '#fff', icon: '🛒' })
    ).toBe(true);
  });

  it('returns true for PaymentGroup with archived', () => {
    expect(isPaymentGroup({ ...validPaymentGroup, archived: true })).toBe(true);
  });

  it('returns false for null', () => {
    expect(isPaymentGroup(null)).toBe(false);
  });

  it('returns false for non-object', () => {
    expect(isPaymentGroup('string')).toBe(false);
    expect(isPaymentGroup(123)).toBe(false);
    expect(isPaymentGroup([])).toBe(false);
  });

  it('returns false when id is missing', () => {
    const { id: _id, ...rest } = validPaymentGroup;
    expect(isPaymentGroup(rest)).toBe(false);
  });

  it('returns false when name is missing', () => {
    const { name: _name, ...rest } = validPaymentGroup;
    expect(isPaymentGroup(rest)).toBe(false);
  });

  it('returns false when sortOrder is missing', () => {
    const { sortOrder: _sortOrder, ...rest } = validPaymentGroup;
    expect(isPaymentGroup(rest)).toBe(false);
  });

  it('returns false when id is not string', () => {
    expect(isPaymentGroup({ ...validPaymentGroup, id: 123 })).toBe(false);
  });

  it('returns false when sortOrder is not number', () => {
    expect(isPaymentGroup({ ...validPaymentGroup, sortOrder: '0' })).toBe(
      false
    );
  });
});

describe('isPaymentGroupArray', () => {
  it('returns true for empty array', () => {
    expect(isPaymentGroupArray([])).toBe(true);
  });

  it('returns true for array of valid PaymentGroup', () => {
    expect(
      isPaymentGroupArray([
        validPaymentGroup,
        { ...validPaymentGroup, id: 'id2', name: 'Другая' },
      ])
    ).toBe(true);
  });

  it('returns false when one element is invalid', () => {
    expect(isPaymentGroupArray([validPaymentGroup, { id: 'x' }])).toBe(false);
  });
});

describe('fetchPaymentGroups', () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockReset();
  });

  it('calls apiJson with correct path and returns data when guard passes', async () => {
    vi.mocked(apiJson).mockResolvedValue([validPaymentGroup]);

    const result = await fetchPaymentGroups();

    expect(apiJson).toHaveBeenCalledWith(
      '/api/payment-groups',
      {},
      expect.any(Function)
    );
    expect(result).toEqual([validPaymentGroup]);
  });
});

describe('fetchArchivedPaymentGroups', () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockReset();
  });

  it('calls apiJson with archived path and returns data when guard passes', async () => {
    vi.mocked(apiJson).mockResolvedValue([validPaymentGroup]);

    const result = await fetchArchivedPaymentGroups();

    expect(apiJson).toHaveBeenCalledWith(
      '/api/payment-groups/archived',
      {},
      expect.any(Function)
    );
    expect(result).toEqual([validPaymentGroup]);
  });
});

describe('fetchPaymentGroup', () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockReset();
  });

  it('calls apiJson with id in path', async () => {
    vi.mocked(apiJson).mockResolvedValue(validPaymentGroup);

    await fetchPaymentGroup('abc-123');

    expect(apiJson).toHaveBeenCalledWith(
      '/api/payment-groups/abc-123',
      {},
      expect.any(Function)
    );
  });
});

describe('createPaymentGroup', () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockReset();
  });

  it('sends POST with body', async () => {
    vi.mocked(apiJson).mockResolvedValue(validPaymentGroup);

    await createPaymentGroup({ name: 'Новая', sortOrder: 0 });

    expect(apiJson).toHaveBeenCalledWith(
      '/api/payment-groups',
      { method: 'POST', body: { name: 'Новая', sortOrder: 0 } },
      expect.any(Function)
    );
  });
});

describe('updatePaymentGroup', () => {
  beforeEach(() => {
    vi.mocked(apiJson).mockReset();
  });

  it('sends PATCH with id and body', async () => {
    vi.mocked(apiJson).mockResolvedValue(validPaymentGroup);

    await updatePaymentGroup('id1', { name: 'Обновлено' });

    expect(apiJson).toHaveBeenCalledWith(
      '/api/payment-groups/id1',
      { method: 'PATCH', body: { name: 'Обновлено' } },
      expect.any(Function)
    );
  });
});

describe('deletePaymentGroup', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('throws when response not ok', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as Response);

    await expect(deletePaymentGroup('id1')).rejects.toThrow('Not found');
  });

  it('does not throw when response ok', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ ok: true } as Response);

    await expect(deletePaymentGroup('id1')).resolves.toBeUndefined();
  });
});
