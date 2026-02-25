from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import ChatSession
import bleach
from .utils import get_ai_response,find_relevant_faqs,is_rate_limited,find_best_faq,get_client_ip

class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ip = get_client_ip(request)
        if is_rate_limited(ip):
            return Response(
                {'error': 'Too many requests. Please slow down and try again in a minute.'},
                status=429
            )

        message = request.data.get('message', '').strip()
        message = bleach.clean(message)  # strips any HTML/script tags
        session_id = request.data.get('session_id', 'anonymous')
        history = request.data.get('history', [])

        if not message:
            return Response({'error': 'Message is required'}, status=400)

        best_match = find_best_faq(message)
        print(best_match)
        if best_match:
            response_text = best_match.answer
        else:
            try:
                relevant_faqs = find_relevant_faqs(message, top_n=3)
                response_text = get_ai_response(message, relevant_faqs, history)
            except Exception as e:
                print(f"AI error: {e}")
                response_text = (
                    "I'm sorry, I couldn't find information on that. "
                    "Please contact GSU directly or visit the main website."
                )

        ChatSession.objects.create(
            session_id=session_id,
            message=message,
            response=response_text
        )

        return Response({
            'response': response_text,
            'session_id': session_id
        })


class ChatLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.profile.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)
        
        logs = ChatSession.objects.all().order_by('-timestamp')
        data = [
            {
                'session_id': log.session_id,
                'message': log.message,
                'response': log.response,
                'timestamp': log.timestamp
            }
            for log in logs
        ]
        return Response(data)