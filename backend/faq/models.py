from django.db import models

class KnowledgeBase(models.Model):
    category = models.CharField(max_length=100)
    question = models.TextField()
    answer = models.TextField()
    keywords = models.CharField(max_length=255)

    def __str__(self):
        return self.question