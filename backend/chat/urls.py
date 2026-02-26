from django.urls import path
from .views import ChatView, ChatLogsView, AnalyticsView

urlpatterns = [
    path('chat/', ChatView.as_view()),
    path('admin/chat-logs/', ChatLogsView.as_view()),
    path('admin/analytics/', AnalyticsView.as_view()),
]