from django.http import JsonResponse
from .services.weather_service import weather_service
from .services.alert_engine import alert_engine


def weather_api(request):
    latitude = request.GET.get("latitude")
    longitude = request.GET.get("longitude")

    if not latitude or not longitude:
        return JsonResponse(
            {
                "success": False,
                "message": "Latitude and Longitude are required."
            },
            status=400,
        )

    weather = weather_service.get_weather(latitude, longitude)

    alerts = alert_engine.generate_alerts(weather)

    return JsonResponse(
        {
            "success": True,
            "weather": weather,
            "alerts": alerts,
        }
    )