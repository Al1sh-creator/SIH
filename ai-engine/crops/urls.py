from django.urls import path
from .views import (crop_recommendation,fertilizer_recommendation,irrigation_prediction,crop_yield_prediction,)
urlpatterns = [
    path("recommend/", crop_recommendation),
    path("fertilizer/", fertilizer_recommendation),
    path("irrigation/", irrigation_prediction),
    path("yield/", crop_yield_prediction),
]