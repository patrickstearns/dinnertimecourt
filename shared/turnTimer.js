/** Stable key for an actionable turn — timer starts only after the client confirms ready for this key. */
function turnTimerKey(g, playerId) {
  if (!g || !playerId) return null;
  if (g.phase === 'day_market') {
    const p = (g.players || []).find((x) => x.id === playerId);
    if (!p || g.day?.turnSeat !== p.seat) return null;
    if ((g.day?.passed || []).includes(playerId)) return null;
    return `market-r${g.round}-s${g.day.turnSeat}`;
  }
  if (g.phase === 'day_cook') {
    if ((g.cook?.done || []).includes(playerId)) return null;
    return `cook-r${g.round}-${playerId}`;
  }
  if (g.phase === 'night_case') {
    const n = g.night;
    if (!n || n.awaitingDice || n.awaitingAdvance || !n.activeCase) return null;
    if (n.currentActorId !== playerId) return null;
    return `court-r${g.round}-i${n.currentIndex}-a${playerId}-d${n.defenseScore}-c${n.caseDifficulty}`;
  }
  return null;
}

module.exports = { turnTimerKey };
