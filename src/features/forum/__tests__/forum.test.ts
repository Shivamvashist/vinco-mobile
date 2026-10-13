import { checkPurchase, denariiShort, EARN_WAYS, FORUM_ITEMS, getForumItem } from '../forum';

describe('checkPurchase', () => {
  const truce = getForumItem('truce');
  const card = getForumItem('cardNox');

  it('allows a purchase that is affordable and within limits', () => {
    expect(checkPurchase(truce, 50, { held: 0, boughtToday: 0 })).toBe('ok');
  });

  it('says why a purchase is refused', () => {
    expect(checkPurchase(truce, 49, { held: 0, boughtToday: 0 })).toBe('cannotAfford');
    expect(checkPurchase(truce, 500, { held: 3, boughtToday: 0 })).toBe('full');
    expect(checkPurchase(truce, 500, { held: 1, boughtToday: 1 })).toBe('dailyLimit');
    expect(checkPurchase(card, 500, { held: 1, boughtToday: 0 })).toBe('owned');
    expect(checkPurchase(card, Number.NaN, { held: 0, boughtToday: 0 })).toBe('cannotAfford');
  });

  it('counts what is still needed', () => {
    expect(denariiShort(truce, 20)).toBe(30);
    expect(denariiShort(truce, 80)).toBe(0);
    expect(denariiShort(truce, -5)).toBe(50);
  });
});

describe('the catalogue', () => {
  it('has unique items with positive prices', () => {
    expect(new Set(FORUM_ITEMS.map((item) => item.id)).size).toBe(FORUM_ITEMS.length);
    expect(FORUM_ITEMS.every((item) => item.price > 0 && item.maxHeld >= 1)).toBe(true);
  });

  it('lists the live ways to earn first', () => {
    const firstLater = EARN_WAYS.findIndex((way) => way.source !== 'live');
    expect(EARN_WAYS.slice(firstLater).every((way) => way.source !== 'live')).toBe(true);
  });
});
