# backend/chat/urls.py
from django.urls import path

from .views import (
    AdminCreateGroupView,
    MessageDeleteView,
    MessageReactionView,
    TeacherGroupMembersView,
    TeacherGroupMessagesView,
    TeacherGroupThreadView,
    ThreadAvailableMembersView,
    ThreadDeleteView,
    ThreadMemberDetailView,
    ThreadMembersView,
)

app_name = "chat"

urlpatterns = [
    path("teacher-group/", TeacherGroupThreadView.as_view(), name="teacher-group-thread"),
    path("teacher-group/messages/", TeacherGroupMessagesView.as_view(), name="teacher-group-messages"),
    path("teacher-group/members/", TeacherGroupMembersView.as_view(), name="teacher-group-members"),
    path("messages/<uuid:msg_id>/react/", MessageReactionView.as_view(), name="message-reaction"),
    path("messages/<uuid:msg_id>/", MessageDeleteView.as_view(), name="message-delete"),
    path("threads/", AdminCreateGroupView.as_view(), name="thread-create"),
    path("threads/<uuid:thread_id>/", ThreadDeleteView.as_view(), name="thread-delete"),
    path("threads/<uuid:thread_id>/members/", ThreadMembersView.as_view(), name="thread-members"),
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