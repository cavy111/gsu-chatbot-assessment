from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from faq.models import KnowledgeBase
from .models import ChatSession
from django.core.cache import cache
from django.conf import settings
from groq import Groq

client = Groq(api_key=settings.GROQ_API_KEY)

def get_ai_response(user_message, relevant_faqs):
    # build context from whatever FAQs we found (even partial matches)
    faq_context = ""
    if relevant_faqs:
        faq_context = "Here is some relevant information from the GSU knowledge base:\n\n"
        for faq in relevant_faqs:
            faq_context += f"Q: {faq.question}\nA: {faq.answer}\n\n"

    system_prompt = """You are GSU SmartAssist, an intelligent chatbot for Gwanda State University (GSU) in Zimbabwe. 
You help students, staff, and prospective applicants with questions about admissions, programmes, fees, 
academic calendar, library services, ICT support, and general university enquiries.
Be friendly, concise, and professional. If you don't know something specific about GSU, 
say so honestly and suggest they contact the university directly."""

    messages = [
        {"role": "system", "content": system_prompt},
    ]

    if faq_context:
        messages.append({"role": "user", "content": faq_context})
        messages.append({"role": "assistant", "content": "Thank you, I'll use this information to help answer questions."})

    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
       model="llama-3.3-70b-versatile",
        messages=messages,
        max_tokens=300,
        temperature=0.7
    )

    return response.choices[0].message.content.strip()

def find_relevant_faqs(message, top_n=3):
    """Return top N FAQs by keyword score, even partial matches."""
    message_words = set(message.lower().split())
    scored = []

    for faq in KnowledgeBase.objects.all():
        keywords = {k.strip().lower() for k in faq.keywords.split(',')}
        score = len(message_words.intersection(keywords))
        if score > 0:
            scored.append((score, faq))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [faq for _, faq in scored[:top_n]]

def find_best_faq(message):
    """Return single best match only if score is strong enough."""
    message_words = set(message.lower().split())
    best_match = None
    best_score = 0

    for faq in KnowledgeBase.objects.all():
        keywords = {k.strip().lower() for k in faq.keywords.split(',')}
        score = len(message_words.intersection(keywords))
        if score > best_score:
            best_score = score
            best_match = faq

    # only return if at least 2 keywords matched (strong match)
    if best_score >= 2:
        return best_match
    return None

def is_rate_limited(ip, limit=10, window=60):
    key = f'ratelimit_{ip}'
    requests = cache.get(key, 0)
    if requests >= limit:
        return True
    cache.set(key, requests + 1, timeout=window)
    return False

def get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0]
    return request.META.get('REMOTE_ADDR')

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
        session_id = request.data.get('session_id', 'anonymous')

        if not message:
            return Response({'error': 'Message is required'}, status=400)

        # try strong keyword match first
        best_match = find_best_faq(message)

        if best_match:
            # strong match found, return directly without using AI tokens
            response_text = best_match.answer
        else:
            # no strong match — get relevant FAQs as context and ask AI
            try:
                relevant_faqs = find_relevant_faqs(message, top_n=3)
                print(relevant_faqs)
                response_text = get_ai_response(message, relevant_faqs)
            except Exception as e:
                print('error:',e)
                # if AI call fails, fall back gracefully
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