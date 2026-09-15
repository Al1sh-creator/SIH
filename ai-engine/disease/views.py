from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging
from ai.decision_engine.vision_service import vision_service

logger = logging.getLogger(__name__)


@api_view(['POST'])
def detect_disease(request):
    """Legacy endpoint — detect + Groq in one slow call. Kept for compatibility."""
    try:
        data = request.data
        base64_image = data.get('image')
        crop_type = data.get('cropType', 'Unknown/Other')

        if not base64_image:
            return Response({'error': 'Image data (base64) is required.'}, status=status.HTTP_400_BAD_REQUEST)

        result = vision_service.analyze_disease(base64_image, crop_type)

        if 'error' in result:
            if result.get('error_type') == 'invalid_image':
                return Response(result, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in detect_disease view: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def detect_disease_fast(request):
    """
    Stage 1 — Instant response (~1-2 sec).
    Runs local CV model + local knowledge-base treatment only. Never calls Groq.
    Response includes 'predicted_class' and 'groq_enhanced: false' so the frontend
    knows to call /enhance/ next.
    """
    try:
        data = request.data
        base64_image = data.get('image')
        crop_type = data.get('cropType', 'Unknown/Other')

        if not base64_image:
            return Response({'error': 'Image data (base64) is required.'}, status=status.HTTP_400_BAD_REQUEST)

        result = vision_service.analyze_disease_fast(base64_image, crop_type)

        if 'error' in result:
            if result.get('error_type') == 'invalid_image':
                return Response(result, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in detect_disease_fast view: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def enhance_treatment(request):
    """
    Stage 2 — Groq enhancement (called after Stage 1 result is already shown).
    Accepts 'predicted_class', 'confidence', 'cropType'.
    Returns richer treatment text from Groq (or local KB if Groq is unavailable).
    """
    try:
        data = request.data
        predicted_class = data.get('predicted_class')
        confidence = data.get('confidence')
        crop_type = data.get('cropType', 'Unknown/Other')

        if not predicted_class or confidence is None:
            return Response(
                {'error': 'predicted_class and confidence are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = vision_service.enhance_with_groq(predicted_class, float(confidence), crop_type)
        return Response(result, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error in enhance_treatment view: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
