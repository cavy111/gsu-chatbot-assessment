from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from faq.models import KnowledgeBase
from .models import ChatSession

def find_relevant_faq(message):
    message_words = set(message.lower().split())
    
    best_match = None
    best_score = 0

    for faq in KnowledgeBase.objects.all():
        keywords = set(faq.keywords.lower().split(','))
        # strip whitespace from each keyword
        keywords = {k.strip() for k in keywords}
        
        # score = how many keywords appear in the user's message
        score = len(message_words.intersection(keywords))
        
        if score > best_score:
            best_score = score
            best_match = faq

    if best_score > 0:
        return best_match
    return None


class ChatView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        message = request.data.get('message', '').strip()
        session_id = request.data.get('session_id', 'anonymous')

        if not message:
            return Response({'error': 'Message is required'}, status=400)

        # find best matching FAQ
        match = find_relevant_faq(message)

        if match:
            response_text = match.answer
        else:
            response_text = (
                "I'm sorry, I couldn't find information on that. "
                "Please contact GSU directly or visit the main website."
            )

        # log the conversation
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