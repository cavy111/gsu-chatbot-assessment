from django.urls import path
from .views import FAQListView, FAQAdminView, FAQAdminDetailView

urlpatterns = [
    path('faqs/', FAQListView.as_view()),
    path('admin/faqs/', FAQAdminView.as_view()),
    path('admin/faqs/<int:pk>/', FAQAdminDetailView.as_view()),
]