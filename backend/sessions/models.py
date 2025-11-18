from django.conf import settings
from django.db import models


class ConversationTurn(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=64)
    turn_index = models.PositiveIntegerField()

    transcript = models.TextField()
    reasoning_json = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "session_id", "turn_index")

    def __str__(self) -> str:  # pragma: no cover - simple repr
        return f"ConversationTurn<{self.user_id}:{self.session_id}:{self.turn_index}>"
