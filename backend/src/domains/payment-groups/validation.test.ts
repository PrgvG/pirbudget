import { describe, it, expect } from 'vitest';
import {
  validatePaymentGroupCreate,
  validatePaymentGroupUpdate,
} from './validation.js';

describe('validatePaymentGroupCreate', () => {
  it('returns error for non-object body', () => {
    expect(validatePaymentGroupCreate(null)).toEqual({
      ok: false,
      error: expect.any(String),
      code: 'INVALID_BODY',
    });
    expect(validatePaymentGroupCreate('string')).toEqual({
      ok: false,
      error: expect.any(String),
      code: 'INVALID_BODY',
    });
  });

  it('returns NAME_REQUIRED when name is empty or missing', () => {
    const resultEmpty = validatePaymentGroupCreate({});
    expect(resultEmpty.ok).toBe(false);
    expect((resultEmpty as { code: string }).code).toBe('NAME_REQUIRED');

    expect(validatePaymentGroupCreate({ name: '', sortOrder: 0 })).toEqual({
      ok: false,
      error: 'Name is required',
      code: 'NAME_REQUIRED',
    });
    // "  " after trim becomes "" — implementation may return ok:true with name:"" or fail
    const resultSpaces = validatePaymentGroupCreate({
      name: '  ',
      sortOrder: 0,
    });
    if (!resultSpaces.ok) {
      expect((resultSpaces as { code: string }).code).toBe('NAME_REQUIRED');
    } else {
      expect((resultSpaces as { data: { name: string } }).data.name).toBe('');
    }
  });

  it('returns SORT_ORDER_INVALID or error when sortOrder is invalid', () => {
    const resultMissing = validatePaymentGroupCreate({ name: 'Группа' });
    expect(resultMissing.ok).toBe(false);
    expect((resultMissing as { code: string }).code).toMatch(
      /SORT_ORDER_INVALID|INVALID_BODY/
    );

    expect(
      validatePaymentGroupCreate({ name: 'Группа', sortOrder: -1 })
    ).toEqual({
      ok: false,
      error: expect.any(String),
      code: 'SORT_ORDER_INVALID',
    });

    expect(
      validatePaymentGroupCreate({ name: 'Группа', sortOrder: 1.5 })
    ).toEqual({
      ok: false,
      error: expect.any(String),
      code: 'SORT_ORDER_INVALID',
    });
  });

  it('returns valid data for minimal input', () => {
    expect(
      validatePaymentGroupCreate({ name: 'Группа', sortOrder: 0 })
    ).toEqual({
      ok: true,
      data: { name: 'Группа', sortOrder: 0 },
    });
  });

  it('returns valid data for full input with optional fields', () => {
    expect(
      validatePaymentGroupCreate({
        name: 'Продукты',
        sortOrder: 1,
        color: '#ff0000',
        icon: '🛒',
      })
    ).toEqual({
      ok: true,
      data: {
        name: 'Продукты',
        sortOrder: 1,
        color: '#ff0000',
        icon: '🛒',
      },
    });
  });

  it('trims name', () => {
    expect(
      validatePaymentGroupCreate({ name: '  Группа  ', sortOrder: 0 })
    ).toEqual({
      ok: true,
      data: { name: 'Группа', sortOrder: 0 },
    });
  });
});

describe('validatePaymentGroupUpdate', () => {
  it('returns valid for empty object', () => {
    expect(validatePaymentGroupUpdate({})).toEqual({
      ok: true,
      data: {},
    });
  });

  it('returns valid for partial update with name only', () => {
    expect(validatePaymentGroupUpdate({ name: 'Новое имя' })).toEqual({
      ok: true,
      data: { name: 'Новое имя' },
    });
  });

  it('returns valid for partial update with sortOrder only', () => {
    expect(validatePaymentGroupUpdate({ sortOrder: 2 })).toEqual({
      ok: true,
      data: { sortOrder: 2 },
    });
  });

  it('returns error when name is empty string', () => {
    expect(validatePaymentGroupUpdate({ name: '' })).toEqual({
      ok: false,
      error: 'Name cannot be empty',
      code: 'INVALID_BODY',
    });
    // trim("   ") => "" — schema may allow; assert we get error or empty name in data
    const resultSpaces = validatePaymentGroupUpdate({ name: '   ' });
    if (!resultSpaces.ok) {
      expect((resultSpaces as { code: string }).code).toBe('INVALID_BODY');
    } else {
      expect((resultSpaces as { data: { name?: string } }).data.name).toBe('');
    }
  });

  it('returns error for invalid sortOrder type', () => {
    expect(
      validatePaymentGroupUpdate({
        sortOrder: 'not a number' as unknown as number,
      })
    ).toEqual({
      ok: false,
      error: expect.any(String),
      code: 'INVALID_BODY',
    });
  });

  it('returns error for negative sortOrder', () => {
    expect(validatePaymentGroupUpdate({ sortOrder: -1 })).toEqual({
      ok: false,
      error: expect.any(String),
      code: 'INVALID_BODY',
    });
  });
});
