from django.urls import path
from .views import ChatView, ChatLogsView
from django.http import JsonResponse

def ratelimited_error(request, exception):
    return JsonResponse(
        {'error': 'Too many requests. Please slow down and try again in a minute.'},
        status=429
    )

handler403 = ratelimited_error

urlpatterns = [
    path('chat/', ChatView.as_view()),
    path('admin/chat-logs/', ChatLogsView.as_view()),
]