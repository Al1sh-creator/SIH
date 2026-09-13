from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import logging
from ai.decision_engine.vision_service import vision_service

logger = logging.getLogger(__name__)

@api_view(['POST'])
def detect_disease(request):
    try:
        data = request.data
        base64_image = data.get('image')
        crop_type = data.get('cropType', 'Unknown/Other')
        
        if not base64_image:
            return Response({'error': 'Image data (base64) is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        result = vision_service.analyze_disease(base64_image, crop_type)
        
        if 'error' in result:
            return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error in detect_disease view: {str(e)}")
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
