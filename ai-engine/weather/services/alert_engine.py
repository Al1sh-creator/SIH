class AlertEngine:

    def generate_alerts(self, weather):

        alerts = []

        if weather["temperature"] > 40:
            alerts.append("High temperature. Increase irrigation.")

        if weather["temperature"] < 10:
            alerts.append("Low temperature. Protect crops from cold.")

        if weather["rainfall"] > 20:
            alerts.append("Heavy rainfall expected. Avoid irrigation.")

        if weather["rainfall"] == 0:
            alerts.append("No rainfall expected. Irrigation may be required.")

        if weather["wind_speed"] > 30:
            alerts.append("Strong winds expected. Secure crops.")

        if weather["humidity"] > 90:
            alerts.append("High humidity. Monitor crops for fungal diseases.")

        return alerts


alert_engine = AlertEngine()