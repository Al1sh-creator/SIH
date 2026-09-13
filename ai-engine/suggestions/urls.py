from django.urls import path
from .views import generate_suggestion, generate_categorized_suggestion

urlpatterns = [
    path("", generate_suggestion),
    path("categorized/", generate_categorized_suggestion),
]