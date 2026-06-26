// Bracket generator - creates single elimination bracket from seeded teams

import Match from '../models/Match.js';

export const generateBracket = async (tournamentId, teamIds) => {
  // Ensure team count is a power of 2 (pad with byes if needed)
  let teams = [...teamIds];
  const nextPower = Math.pow(2, Math.ceil(Math.log2(teams.length)));
  while (teams.length < nextPower) {
    teams.push(null); // null = bye
  }

  const totalMatches = nextPower - 1;
  const rounds = Math.log2(nextPower);
  const matches = [];

  let matchNumber = 1;

  // Create first round matches (teams play)
  const firstRoundMatches = nextPower / 2;
  for (let i = 0; i < firstRoundMatches; i++) {
    matches.push({
      tournament: tournamentId,
      teamA: teams[i * 2],
      teamB: teams[i * 2 + 1],
      round: 1,
      matchNumber: matchNumber,
      nextMatchNumber: firstRoundMatches + Math.floor(i / 2) + 1,
    });
    matchNumber++;
  }

  // Create remaining rounds (empty, filled as winners advance)
  for (let round = 2; round <= rounds; round++) {
    const matchesInRound = nextPower / Math.pow(2, round);
    for (let i = 0; i < matchesInRound; i++) {
      const nextMatch = round < rounds ? matchNumber + matchesInRound - i + Math.floor(i / 2) : null;
      matches.push({
        tournament: tournamentId,
        teamA: null,
        teamB: null,
        round: round,
        matchNumber: matchNumber,
        nextMatchNumber: round < rounds ? Math.floor((matchNumber - firstRoundMatches - 1) / 2) + firstRoundMatches + matchesInRound + 1 : null,
      });
      matchNumber++;
    }
  }

  // Save all matches to DB
  const created = await Match.insertMany(matches);

  // Auto-advance byes in first round
  for (const match of created) {
    if (match.round === 1) {
      if (match.teamA && !match.teamB) {
        match.winner = match.teamA;
        match.status = 'completed';
        await match.save();
      } else if (!match.teamA && match.teamB) {
        match.winner = match.teamB;
        match.status = 'completed';
        await match.save();
      }
    }
  }

  return created;
};
