from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import KnowledgeBase
from .serializers import KnowledgeBaseSerializer

# Public - anyone can read FAQs
class FAQListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        faqs = KnowledgeBase.objects.all()
        serializer = KnowledgeBaseSerializer(faqs, many=True)
        return Response(serializer.data)

# Admin only - manage FAQs
class FAQAdminView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if request.user.profile.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        serializer = KnowledgeBaseSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class FAQAdminDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        if request.user.profile.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        faq = KnowledgeBase.objects.get(pk=pk)
        serializer = KnowledgeBaseSerializer(faq, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        if request.user.profile.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        KnowledgeBase.objects.get(pk=pk).delete()
        return Response(status=204)