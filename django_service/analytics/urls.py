from django.urls import path
from . import views

urlpatterns = [
    path('train/', views.trigger_training, name='train_model'),
    path('predict/', views.get_match_prediction, name='predict_match'),
    path('summary/<str:match_id>/', views.get_match_summary, name='match_summary'),
    path('player/<str:player_id>/', views.player_analytics, name='player_analytics'),
]
