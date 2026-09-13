from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/weather/', include('weather.urls')),
    path('api/crops/', include('crops.urls')),
    path('api/suggestions/', include('suggestions.urls')),
    path('api/accounts/', include('accounts.urls')),
    path('api/disease/', include('disease.urls')),
]