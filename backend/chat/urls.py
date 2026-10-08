from django.urls import path

from .views import (
    MessageReactionView,
    TeacherGroupMembersView,
    TeacherGroupMessagesView,
    TeacherGroupThreadView,
    ThreadMembersView,
    ThreadMemberDetailView,
    ThreadAvailableMembersView,
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
    path(
        "threads/<uuid:thread_id>/members/",
        ThreadMembersView.as_view(),
        name="thread-members",
    ),
    path(
        "threads/<uuid:thread_id>/members/<uuid:user_id>/",
        ThreadMemberDetailView.as_view(),
        name="thread-member-detail",
    ),
    path(
        "threads/<uuid:thread_id>/available-members/",
        ThreadAvailableMembersView.as_view(),
        name="thread-available-members",
    ),
]