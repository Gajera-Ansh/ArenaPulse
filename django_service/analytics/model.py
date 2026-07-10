import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from .db import db

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'match_predictor.pkl')

def get_team_stats(target_game=None):
    """Calculate overall stats for all teams, optionally filtered by game"""
    query = {"status": "completed", "winner": {"$ne": None}}
    if target_game:
        # Pre-fetch tournaments matching the game
        tournaments = list(db.tournaments.find({"game": target_game}, {"_id": 1}))
        t_ids = [t['_id'] for t in tournaments]
        query["tournament"] = {"$in": t_ids}
        
    matches = list(db.matches.find(query))
    team_stats = {}
    
    for match in matches:
        teamA = str(match.get('teamA'))
        teamB = str(match.get('teamB'))
        winner = str(match.get('winner'))
        
        if teamA and teamA != 'None':
            if teamA not in team_stats:
                team_stats[teamA] = {'matches': 0, 'wins': 0}
            team_stats[teamA]['matches'] += 1
            if winner == teamA:
                team_stats[teamA]['wins'] += 1
                
        if teamB and teamB != 'None':
            if teamB not in team_stats:
                team_stats[teamB] = {'matches': 0, 'wins': 0}
            team_stats[teamB]['matches'] += 1
            if winner == teamB:
                team_stats[teamB]['wins'] += 1
                
    # Compute win rate
    for team_id, stats in team_stats.items():
        stats['win_rate'] = stats['wins'] / stats['matches'] if stats['matches'] > 0 else 0.5
        
    return team_stats

def train_model():
    matches = list(db.matches.find({"status": "completed", "winner": {"$ne": None}}))
    
    X = []
    y = []
    
    if len(matches) > 0:
        team_stats = get_team_stats()
        
        for match in matches:
            teamA = str(match.get('teamA'))
            teamB = str(match.get('teamB'))
            winner = str(match.get('winner'))
            
            if teamA == 'None' or teamB == 'None' or not teamA or not teamB:
                continue
                
            statsA = team_stats.get(teamA, {'matches': 0, 'win_rate': 0.5})
            statsB = team_stats.get(teamB, {'matches': 0, 'win_rate': 0.5})
            
            # Features: TeamA Win Rate, TeamA Matches, TeamB Win Rate, TeamB Matches
            features = [statsA['win_rate'], statsA['matches'], statsB['win_rate'], statsB['matches']]
            X.append(features)
            
            # Label: 1 if TeamA won, 0 if TeamB won
            label = 1 if winner == teamA else 0
            y.append(label)
            
            # To balance the dataset, add the reverse perspective
            features_rev = [statsB['win_rate'], statsB['matches'], statsA['win_rate'], statsA['matches']]
            X.append(features_rev)
            y.append(1 if winner == teamB else 0)
            
    # If no valid matches found in DB, inject dummy dataset so the model can compile and run in the UI
    if len(X) < 2:
        print("Not enough real match data. Training on dummy dataset for demonstration.")
        # Dummy: High win rate beats low win rate
        X = [
            [0.8, 10, 0.2, 10], # Team A much better
            [0.2, 10, 0.8, 10], # Team B much better
            [0.5, 2, 0.5, 2],   # Equal
            [0.6, 5, 0.4, 5],   # Team A slightly better
            [0.4, 5, 0.6, 5]    # Team B slightly better
        ]
        y = [1, 0, 1, 1, 0]
        
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, MODEL_PATH)
    return True, f"Model trained on {len(X)//2} matches."

def predict_match(teamA_id, teamB_id, game_name=None, scoreA=0, scoreB=0):
    try:
        model = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        return None, "Model not trained yet."
        
    team_stats = get_team_stats(target_game=game_name)
    statsA = team_stats.get(str(teamA_id), {'matches': 0, 'win_rate': 0.5})
    statsB = team_stats.get(str(teamB_id), {'matches': 0, 'win_rate': 0.5})
    
    features = [[statsA['win_rate'], statsA['matches'], statsB['win_rate'], statsB['matches']]]
    prob = model.predict_proba(features)[0]
    
    prob_a_baseline = prob[1]
    
    # Adjust probability dynamically based on live score
    try:
        scoreA = float(scoreA)
        scoreB = float(scoreB)
        total_score = scoreA + scoreB
        
        if total_score > 0:
            # We trust the score more as the total score increases.
            # Max weight for live score is 0.85 (85%) so ML still has a tiny baseline voice.
            score_weight = min(total_score / 20.0, 0.85) 
            score_prob_a = scoreA / total_score
            
            # Blend ML baseline with live score ratio
            final_prob_a = (prob_a_baseline * (1 - score_weight)) + (score_prob_a * score_weight)
        else:
            final_prob_a = prob_a_baseline
    except (ValueError, TypeError):
        final_prob_a = prob_a_baseline
        
    final_prob_b = 1.0 - final_prob_a
    
    return {
        "team_a_prob": round(final_prob_a * 100, 1),
        "team_b_prob": round(final_prob_b * 100, 1),
        "team_a_stats": statsA,
        "team_b_stats": statsB
    }, None

def generate_match_summary(match_id):
    from bson.objectid import ObjectId
    try:
        match = db.matches.find_one({"_id": ObjectId(match_id)})
        if not match:
            return "Match not found."
            
        if match.get('status') != 'completed':
            return "Match is not yet completed."
            
        winner_id = match.get('winner')
        if not winner_id:
            return "No winner declared."
            
        teamA_id = match.get('teamA')
        teamB_id = match.get('teamB')
        
        # Fetch teams
        teamA = db.teams.find_one({"_id": ObjectId(teamA_id)}) if teamA_id else None
        teamB = db.teams.find_one({"_id": ObjectId(teamB_id)}) if teamB_id else None
        
        nameA = teamA['name'] if teamA else 'Team A'
        nameB = teamB['name'] if teamB else 'Team B'
        
        winner_name = nameA if str(winner_id) == str(teamA_id) else nameB
        loser_name = nameB if str(winner_id) == str(teamA_id) else nameA
        
        scoreA = match.get('scoreA', 0)
        scoreB = match.get('scoreB', 0)
        
        win_score = scoreA if str(winner_id) == str(teamA_id) else scoreB
        lose_score = scoreB if str(winner_id) == str(teamA_id) else scoreA
        
        # Check player stats to find MVP
        player_stats = match.get('playerStats', {})
        best_player_name = None
        highest_kills = -1
        
        for p_id, stats in player_stats.items():
            if int(stats.get('kills', 0)) > highest_kills:
                highest_kills = int(stats.get('kills', 0))
                best_player_name = stats.get('name', 'A player')
                
        summary = f"{winner_name} secured a decisive victory over {loser_name} with a final score of {win_score}-{lose_score}. "
        if best_player_name and highest_kills > 0:
            summary += f"The standout performance came from {best_player_name}, who dominated the arena with {highest_kills} kills."
            
        return summary
    except Exception as e:
        return str(e)
