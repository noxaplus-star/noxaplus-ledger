import { describe, expect, it } from 'vitest';
import {
  BACKUP_APP,
  clearState,
  createBackup,
  loadState,
  parseBackup,
  saveState,
  serializeBackup,
  STORAGE_KEY,
  validateState,
  type StorageLike,
} from './storage';
import { createEmptyState, createSampleState } from './sample';
import { makeState } from './testFixtures';

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Map<string, string> } {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}

describe('validateState', () => {
  it('accepts fixture, empty and sample states', () => {
    expect(validateState(makeState()).ok).toBe(true);
    expect(validateState(createEmptyState()).ok).toBe(true);
    expect(validateState(createSampleState(new Date(2026, 10, 12))).ok).toBe(true);
  });

  it('rejects malformed roots', () => {
    expect(validateState(null).ok).toBe(false);
    expect(validateState({ version: 2 }).ok).toBe(false);
    expect(validateState({ ...makeState(), accounts: [] }).ok).toBe(false);
    expect(validateState({ ...makeState(), categories: [] }).ok).toBe(false);
    expect(validateState({ ...makeState(), settings: {} }).ok).toBe(false);
    expect(validateState({ ...makeState(), updatedAt: -1 }).ok).toBe(false);
  });

  it('rejects duplicate ids', () => {
    const state = makeState();
    const duplicateAccounts = {
      ...state,
      accounts: [state.accounts[0], { ...state.accounts[1], id: state.accounts[0].id }],
    };
    expect(validateState(duplicateAccounts).ok).toBe(false);
    const duplicateTransactions = {
      ...state,
      transactions: [state.transactions[0], { ...state.transactions[1], id: state.transactions[0].id }],
    };
    expect(validateState(duplicateTransactions).ok).toBe(false);
  });

  it('rejects invalid transaction details', () => {
    const state = makeState();
    expect(
      validateState({
        ...state,
        transactions: [{ ...state.transactions[0], date: '1404-13-01' }],
      }).ok,
    ).toBe(false);
    expect(
      validateState({
        ...state,
        transactions: [{ ...state.transactions[0], amount: 0 }],
      }).ok,
    ).toBe(false);
    expect(
      validateState({
        ...state,
        transactions: [{ ...state.transactions[0], accountId: 'missing' }],
      }).ok,
    ).toBe(false);
    expect(
      validateState({
        ...state,
        transactions: [{ ...state.transactions[0], categoryId: 'missing' }],
      }).ok,
    ).toBe(false);
  });

  it('rejects invalid budgets', () => {
    const state = makeState();
    expect(validateState({ ...state, budgets: [{ categoryId: 'missing', amount: 1000 }] }).ok).toBe(
      false,
    );
    expect(validateState({ ...state, budgets: [{ categoryId: 'c-salary', amount: 1000 }] }).ok).toBe(
      false,
    );
    expect(
      validateState({
        ...state,
        budgets: [
          { categoryId: 'c-food', amount: 1000 },
          { categoryId: 'c-food', amount: 2000 },
        ],
      }).ok,
    ).toBe(false);
  });

  it('rejects rules with missing categories', () => {
    expect(
      validateState({
        ...makeState(),
        rules: [{ id: 'r', keyword: 'تست', categoryId: 'missing' }],
      }).ok,
    ).toBe(false);
  });
});

describe('persistence', () => {
  it('reports no data for an empty storage', () => {
    expect(loadState(memoryStorage())).toEqual({ state: null, warning: null });
  });

  it('saves and loads the state', () => {
    const storage = memoryStorage();
    const state = makeState();
    expect(saveState(state, storage)).toBe(true);
    expect(loadState(storage).state).toEqual(state);
  });

  it('warns about corrupted JSON', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{oops' });
    expect(loadState(storage).state).toBeNull();
    expect(loadState(storage).warning).toBeTruthy();
  });

  it('warns about structurally invalid data', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ version: 1 }) });
    expect(loadState(storage).state).toBeNull();
    expect(loadState(storage).warning).toBeTruthy();
  });

  it('survives unavailable storage', () => {
    expect(loadState(undefined)).toMatchObject({ state: null });
    expect(saveState(makeState(), undefined)).toBe(false);
  });

  it('reports failed writes', () => {
    const storage: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => undefined,
    };
    expect(saveState(makeState(), storage)).toBe(false);
  });

  it('clears saved data', () => {
    const storage = memoryStorage();
    saveState(makeState(), storage);
    clearState(storage);
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe('backup', () => {
  it('wraps state with app metadata', () => {
    const backup = createBackup(makeState(), new Date('2026-11-12T10:00:00Z'));
    expect(backup.app).toBe(BACKUP_APP);
    expect(backup.version).toBe(1);
    expect(backup.exportedAt).toBe('2026-11-12T10:00:00.000Z');
  });

  it('round-trips a backup', () => {
    const state = makeState();
    const parsed = parseBackup(serializeBackup(state));
    expect('state' in parsed && parsed.state).toEqual(state);
  });

  it('rejects foreign or broken backups', () => {
    expect('error' in parseBackup('not json')).toBe(true);
    expect('error' in parseBackup(JSON.stringify({ app: 'Other', version: 1 }))).toBe(true);
    expect('error' in parseBackup(JSON.stringify({ app: BACKUP_APP, version: 2 }))).toBe(true);
    expect(
      'error' in
        parseBackup(JSON.stringify({ app: BACKUP_APP, version: 1, exportedAt: '', state: {} })),
    ).toBe(true);
  });
});
