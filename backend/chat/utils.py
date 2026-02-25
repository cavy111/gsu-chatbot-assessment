from django.core.cache import cache
from faq.models import KnowledgeBase
from django.conf import settings
from groq import Groq

client = Groq(api_key=settings.GROQ_API_KEY)

def get_ai_response(user_message, relevant_faqs, history=None):
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

    if faq_context:
        system_prompt += f"\n\n{faq_context}"

    messages = [{"role": "system", "content": system_prompt}]

    # inject conversation history (excluding the current message)
    if history:
        for msg in history[:-1]:  # exclude last since we add it manually below
            messages.append({
                "role": msg['role'],
                "content": msg['content']
            })

    # add current message
    messages.append({"role": "user", "content": user_message})

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
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
