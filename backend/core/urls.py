from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('api/', include('faq.urls')),
    path('api/token/', TokenObtainPairView.as_view()),       # login
    path('api/token/refresh/', TokenRefreshView.as_view()),  # refresh token
]