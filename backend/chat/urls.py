from django.urls import path
from .views import ChatView, ChatLogsView

urlpatterns = [
    path('chat/', ChatView.as_view()),
    path('admin/chat-logs/', ChatLogsView.as_view()),
]