module.exports = {
  startingGold: 10,
  partnershipPrestige: 10,
  /** @deprecated use partnershipPrestige — kept for older lobby payloads */
  partnershipGp: 10,
  minPlayers: 2,
  maxPlayers: 6,
  deckBuyCost: 2,
  recipeDeckBuyCost: 1,
  argumentDeckBuyCost: 4,
  argumentSellValue: 2,
  ingredientDeckBuyCost: 2,
  dailySalary: 2,
  marketIngredientSlots: 12,
  ingredientFreshness: 3,
  marketIngredientFreshness: 3,
  /** Max time (ms) for a human to act before they are replaced by AI. */
  turnTimeoutMs: 2 * 60 * 1000,
};
