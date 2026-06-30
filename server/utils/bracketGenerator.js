export const generateRoundRobin = (teams, tournamentId) => {
  const matches = [];
  let matchNumber = 1;

  // Clone teams array
  const activeTeams = [...teams];
  
  // If odd number of teams, add a 'null' team for the Bye
  if (activeTeams.length % 2 !== 0) {
    activeTeams.push(null);
  }

  const numTeams = activeTeams.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  for (let round = 1; round <= numRounds; round++) {
    for (let i = 0; i < matchesPerRound; i++) {
      const home = activeTeams[i];
      const away = activeTeams[numTeams - 1 - i];

      // If neither is the 'Bye' (null)
      if (home !== null && away !== null) {
        matches.push({
          tournament: tournamentId,
          teamA: home.team._id,
          teamB: away.team._id,
          round: round,
          matchNumber: matchNumber++,
          nextMatchNumber: null, // Round robin doesn't auto-advance to a specific match
          status: 'upcoming',
          winner: null
        });
      }
    }
    // Rotate teams for the next round (Circle Method)
    // Keep the first team fixed (index 0), rotate the rest clockwise
    const lastTeam = activeTeams.pop();
    activeTeams.splice(1, 0, lastTeam);
  }

  return matches;
};
