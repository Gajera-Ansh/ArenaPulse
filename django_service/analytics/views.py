from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db import db
import pandas as pd

@api_view(['GET'])
def player_analytics(request, player_id):
    try:
        # 1. Fetch historical match data from MongoDB
        # We find matches where this player has submitted stats
        matches_cursor = db.matches.find({
            'status': 'completed',
            f'playerStats.{player_id}': {'$exists': True}
        }).sort('endDate', 1)  # sort chronologically

        matches = list(matches_cursor)

        if not matches:
            return Response({"success": True, "data": {"history": []}})

        # Pre-fetch games and titles for all referenced tournaments
        tournament_ids = list(set([m.get('tournament') for m in matches if m.get('tournament')]))
        tournaments = list(db.tournaments.find({"_id": {"$in": tournament_ids}}, {"game": 1, "title": 1}))
        tournament_game_map = {str(t['_id']): t.get('game', 'Unknown') for t in tournaments}
        tournament_title_map = {str(t['_id']): t.get('title', 'Unknown Tournament') for t in tournaments}

        history = []
        cumulative_kills = {}
        cumulative_deaths = {}

        # 2. Extract Data
        for match in matches:
            stats = match.get('playerStats', {}).get(player_id, {})
            if not stats:
                continue
            
            k = int(stats.get('kills', 0))
            d = int(stats.get('deaths', 0))
            
            t_id = str(match.get('tournament'))
            game = tournament_game_map.get(t_id, 'Unknown')
            tournament_name = tournament_title_map.get(t_id, 'Unknown Tournament')
            
            cumulative_kills[game] = cumulative_kills.get(game, 0) + k
            cumulative_deaths[game] = cumulative_deaths.get(game, 0) + d
            
            # Prevent Division by zero
            match_kd = round(k / d, 2) if d > 0 else float(k)
            c_kd = round(cumulative_kills[game] / cumulative_deaths[game], 2) if cumulative_deaths[game] > 0 else float(cumulative_kills[game])
            
            # Format date for frontend
            date_obj = match.get('endDate') or match.get('createdAt')
            date_str = date_obj.strftime("%b %d") if date_obj else "Unknown"

            history.append({
                "matchId": str(match.get('_id')),
                "game": game,
                "tournament": tournament_name,
                "date": date_str,
                "kills": k,
                "deaths": d,
                "match_kd": match_kd,
                "cumulative_kd": c_kd
            })

        # 3. Use Pandas for Advanced Analysis (Rolling Averages)
        df = pd.DataFrame(history)
        if not df.empty:
            # Calculate a 3-match moving average for KD per game
            df['moving_avg_kd'] = df.groupby('game')['match_kd'].transform(
                lambda x: x.rolling(window=3, min_periods=1).mean().round(2)
            )
            
            # Fill NaN with None for JSON serialization
            df = df.where(pd.notnull(df), None)
            history = df.to_dict('records')

        return Response({"success": True, "data": {"history": history}})

    except Exception as e:
        return Response({"success": False, "error": str(e)}, status=500)
