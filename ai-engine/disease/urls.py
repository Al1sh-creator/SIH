from django.urls import path
from .views import detect_disease

urlpatterns = [
    path('detect/', detect_disease, name='detect_disease'),
]
