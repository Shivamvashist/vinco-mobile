import { AURORA_FIRST_TRY_DENARII } from '@/features/campaign';

import { awardAuroraFirstTry, spendAlarmPass } from '../aurora';
import { nowIso } from '../database';
import { buyItem, getDenariiBalance } from '../forum';
import { ledger } from '../schema';
import { createTestDatabase } from '../testing/testDatabase';

const TODAY = '2026-10-31';

describe('Aurora in the database', () => {
  it('pays the first try once a day', () => {
    const db = createTestDatabase();
    expect(awardAuroraFirstTry(db, TODAY)).toBe(true);
    expect(awardAuroraFirstTry(db, TODAY)).toBe(false);
    expect(getDenariiBalance(db)).toBe(AURORA_FIRST_TRY_DENARII);
    expect(awardAuroraFirstTry(db, '2026-11-01')).toBe(true);
    expect(getDenariiBalance(db)).toBe(AURORA_FIRST_TRY_DENARII * 2);
  });

  it('spends an alarm pass only when one is held', () => {
    const db = createTestDatabase();
    expect(spendAlarmPass(db, TODAY)).toBe(false);
    db.insert(ledger)
      .values({ day: '2026-10-01', reason: 'dev_grant', amount: 100, createdAt: nowIso() })
      .run();
    buyItem(db, 'venia', TODAY);
    expect(spendAlarmPass(db, TODAY)).toBe(true);
    expect(spendAlarmPass(db, TODAY)).toBe(false);
  });
});
