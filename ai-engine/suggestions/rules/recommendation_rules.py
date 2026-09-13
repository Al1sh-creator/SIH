class RecommendationRules:

    def generate(
        self,
        crop,
        fertilizer,
        irrigation,
        predicted_yield,
    ):

        recommendations = []

        # Fertilizer Rules
        if fertilizer == "Urea":
            recommendations.append(
                "Apply Urea after sowing in two split doses."
            )

        elif fertilizer == "DAP":
            recommendations.append(
                "Use DAP during field preparation."
            )

        elif fertilizer == "MOP":
            recommendations.append(
                "Apply MOP during the vegetative growth stage."
            )

        # Irrigation Rules
        if irrigation == "High":
            recommendations.append(
                "Increase irrigation frequency and monitor soil moisture daily."
            )

        elif irrigation == "Medium":
            recommendations.append(
                "Maintain irrigation every 4–5 days."
            )

        elif irrigation == "Low":
            recommendations.append(
                "Current irrigation is sufficient. Avoid overwatering."
            )

        # Yield Rules
        if predicted_yield >= 5:
            risk = "Low"
            recommendations.append(
                "Excellent yield expected under current conditions."
            )

        elif predicted_yield >= 3:
            risk = "Medium"
            recommendations.append(
                "Moderate yield expected. Monitor crop health regularly."
            )

        else:
            risk = "High"
            recommendations.append(
                "Low expected yield. Improve soil nutrients and irrigation."
            )

        return {
            "risk_level": risk,
            "recommendations": recommendations,
        }


recommendation_rules = RecommendationRules()