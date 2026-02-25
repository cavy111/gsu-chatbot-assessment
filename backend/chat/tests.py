from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from faq.models import KnowledgeBase
from chat.models import Profile

class ChatEndpointTests(TestCase):

    def setUp(self):
        self.client = APIClient()

        # create users — signal auto-creates Profile for each
        self.user = User.objects.create_user(username='testuser', password='pass123')
        self.admin = User.objects.create_user(username='adminuser', password='pass123')

        # update the auto-created profiles with the correct roles
        self.user.profile.role = 'student'
        self.user.profile.save()

        self.admin.profile.role = 'admin'
        self.admin.profile.save()

        # create a sample FAQ
        KnowledgeBase.objects.create(
            category='Admissions',
            question='How do I apply?',
            answer='Apply online at the GSU portal.',
            keywords='apply, admission, register'
        )

    def test_chat_endpoint_returns_response(self):
        res = self.client.post('/api/chat/', {
            'message': 'how do I apply',
            'session_id': 'test-session'
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertIn('response', res.data)

    def test_chat_keyword_match_returns_faq_answer(self):
        res = self.client.post('/api/chat/', {
            'message': 'how do I apply for admission',
            'session_id': 'test-session'
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['response'], 'Apply online at the GSU portal.')

    def test_admin_faqs_endpoint_rejects_unauthenticated(self):
        res = self.client.post('/api/admin/faqs/', {
            'category': 'Test',
            'question': 'Test question',
            'answer': 'Test answer',
            'keywords': 'test'
        }, format='json')
        self.assertEqual(res.status_code, 401)

    def test_admin_faqs_endpoint_rejects_non_admin(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.post('/api/admin/faqs/', {
            'category': 'Test',
            'question': 'Test question',
            'answer': 'Test answer',
            'keywords': 'test'
        }, format='json')
        self.assertEqual(res.status_code, 403)

    def test_admin_faqs_endpoint_allows_admin(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/admin/faqs/', {
            'category': 'Test',
            'question': 'Test question?',
            'answer': 'Test answer.',
            'keywords': 'test'
        }, format='json')
        self.assertEqual(res.status_code, 201)

    def test_chat_logs_rejects_unauthenticated(self):
        res = self.client.get('/api/admin/chat-logs/')
        self.assertEqual(res.status_code, 401)