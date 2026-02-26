from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import ChatSession
import bleach
from .utils import get_ai_response,find_relevant_faqs,is_rate_limited,find_best_faq,get_client_ip
from django.db.models import Count
from django.db.models.functions import TruncDate
from faq.models import KnowledgeBase

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

class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.profile.role != 'admin':
            return Response({'error': 'Forbidden'}, status=403)

        # total messages over time
        messages_over_time = (
            ChatSession.objects
            .annotate(date=TruncDate('timestamp'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        # most asked topics — based on first word grouping
        # we detect topic by checking which FAQ keywords appear in the message
        all_sessions = ChatSession.objects.all()
        topic_counts = {}
        unmatched = 0

        for session in all_sessions:
            message_words = set(session.message.lower().split())
            best_score = 0
            best_category = None

            for faq in KnowledgeBase.objects.all():
                keywords = {k.strip().lower() for k in faq.keywords.split(',')}
                score = len(message_words.intersection(keywords))
                if score > best_score:
                    best_score = score
                    best_category = faq.category

            if best_category and best_score >= 1:
                topic_counts[best_category] = topic_counts.get(best_category, 0) + 1
            else:
                unmatched += 1

        # messages per session
        messages_per_session = (
            ChatSession.objects
            .values('session_id')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]  # top 10 sessions
        )

        # summary stats
        total_messages = ChatSession.objects.count()
        total_sessions = ChatSession.objects.values('session_id').distinct().count()

        return Response({
            'summary': {
                'total_messages': total_messages,
                'total_sessions': total_sessions,
                'unmatched_queries': unmatched,
            },
            'messages_over_time': [
                {'date': str(item['date']), 'messages': item['count']}
                for item in messages_over_time
            ],
            'topics': [
                {'topic': k, 'count': v}
                for k, v in sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)
            ],
            'messages_per_session': [
                {'session': item['session_id'][:12] + '...', 'messages': item['count']}
                for item in messages_per_session
            ]
        })