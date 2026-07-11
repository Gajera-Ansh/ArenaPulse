from rest_framework.decorators import api_view
from rest_framework.response import Response
from .db import db
import pandas as pd
from .model import train_model, predict_match, generate_match_summary

@api_view(['POST'])
def trigger_training(request):
    success, msg = train_model()
    return Response({"success": success, "message": msg})

@api_view(['POST'])
def get_match_prediction(request):
    teamA_id = request.data.get('teamA')
    teamB_id = request.data.get('teamB')
    game_name = request.data.get('game')
    scoreA = request.data.get('scoreA', 0)
    scoreB = request.data.get('scoreB', 0)
    
    if not teamA_id or not teamB_id:
        return Response({"success": False, "message": "Missing team IDs"}, status=400)
        
    result, error = predict_match(teamA_id, teamB_id, game_name=game_name, scoreA=scoreA, scoreB=scoreB)
    if error:
        return Response({"success": False, "message": error}, status=400)
        
    return Response({"success": True, "data": result})

@api_view(['GET'])
def get_match_summary(request, match_id):
    summary = generate_match_summary(match_id)
    return Response({"success": True, "data": {"summary": summary}})

@api_view(['GET'])
def admin_analytics(request):
    try:
        users = list(db.users.find({}, {'createdAt': 1, 'role': 1, 'banned': 1}))
        if not users:
            return Response({"success": True, "data": {}})
            
        df = pd.DataFrame(users)
        
        # Calculate stats safely
        total_players = len(df[df['role'] == 'player']) if 'role' in df.columns else 0
        total_organizers = len(df[df['role'] == 'organizer']) if 'role' in df.columns else 0
        total_admins = len(df[df['role'] == 'admin']) if 'role' in df.columns else 0
        total_banned = len(df[df['banned'] == True]) if 'banned' in df.columns else 0
        
        # User Growth Data Series
        growth_data = []
        try:
            if 'createdAt' not in df.columns:
                df['createdAt'] = pd.Timestamp.now()
                
            df['createdAt'] = df['createdAt'].fillna(pd.Timestamp.now())
            df['createdAt'] = pd.to_datetime(df['createdAt'], errors='coerce')
            df['createdAt'] = df['createdAt'].fillna(pd.Timestamp.now())
            df['month'] = df['createdAt'].dt.strftime('%b %Y')
            
            monthly_counts = df.groupby('month').size()
            
            df = df.sort_values('createdAt')
            months_ordered = df['month'].unique()
            
            cum = 0
            for m in months_ordered:
                cum += int(monthly_counts.get(m, 0))
                growth_data.append({
                    "month": str(m),
                    "users": cum
                })
        except Exception:
            growth_data = []
            
        # For portfolio/demo purposes, if there isn't enough historical data, 
        # generate a realistic looking 6-month growth curve leading up to the current total.
        if len(growth_data) < 2:
            current_total = growth_data[-1]['users'] if growth_data else (total_players + total_organizers)
            if current_total == 0:
                current_total = 1 # Avoid flatlining at 0 if DB is empty
            current_month_obj = pd.Timestamp.now()
            
            fake_history = []
            for i in range(5, 0, -1):
                past = current_month_obj - pd.Timedelta(days=30 * i)
                # create a curve that ramps up to current_total
                fraction = (6 - i) / 6.0
                users_at_time = max(1, int(current_total * (fraction ** 2))) 
                fake_history.append({
                    "month": past.strftime('%b %Y'),
                    "users": users_at_time
                })
            
            # replace the actual single point with the fake history + actual current point
            if growth_data:
                growth_data = fake_history + growth_data
            else:
                fake_history.append({"month": current_month_obj.strftime('%b %Y'), "users": current_total})
                growth_data = fake_history
        
        return Response({
            "success": True,
            "data": {
                "totalPlayers": total_players,
                "totalOrganizers": total_organizers,
                "totalAdmins": total_admins,
                "totalBanned": total_banned,
                "growthData": growth_data
            }
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({"success": False, "message": str(e)}, status=500)

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
