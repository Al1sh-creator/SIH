from django.urls import path
from .views import detect_disease, detect_disease_fast, enhance_treatment

urlpatterns = [
    path('detect/', detect_disease, name='detect_disease'),           # legacy (slow)
    path('detect/fast/', detect_disease_fast, name='detect_disease_fast'),  # Stage 1 — instant
    path('treatment/enhance/', enhance_treatment, name='enhance_treatment'), # Stage 2 — Groq
]
