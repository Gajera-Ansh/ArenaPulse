from django.urls import path
from . import views

urlpatterns = [
    path('player/<str:player_id>/', views.player_analytics, name='player_analytics'),
]
