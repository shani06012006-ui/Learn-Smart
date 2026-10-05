from django.urls import path

from .views import (
    MessageReactionView,
    TeacherGroupMembersView,
    TeacherGroupMessagesView,
    TeacherGroupThreadView,
)

app_name = "chat"

urlpatterns = [
    path(
        "teacher-group/",
        TeacherGroupThreadView.as_view(),
        name="teacher-group-thread",
    ),
    path(
        "teacher-group/messages/",
        TeacherGroupMessagesView.as_view(),
        name="teacher-group-messages",
    ),
    path(
        "teacher-group/members/",
        TeacherGroupMembersView.as_view(),
        name="teacher-group-members",
    ),
    path(
        "messages/<uuid:msg_id>/react/",
        MessageReactionView.as_view(),
        name="message-reaction",
    ),
]