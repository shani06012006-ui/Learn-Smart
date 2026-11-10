# backend/chat/urls.py
from django.urls import path

from .crud_views import (
    MessageDetailView,
    RoomDetailView,
    RoomLeaveView,
    RoomListCreateView,
    RoomMemberDetailView,
    RoomMembersView,
    RoomMessagesView,
)
from .group_views import ChatGroupListCreateView, ChatGroupMessagesView
from .views import (
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
    # Teacher chat CRUD
    path("rooms/", RoomListCreateView.as_view(), name="room-list-create"),
    path("rooms/<uuid:room_id>/", RoomDetailView.as_view(), name="room-detail"),
    path("rooms/<uuid:room_id>/leave/", RoomLeaveView.as_view(), name="room-leave"),
    path("rooms/<uuid:room_id>/members/", RoomMembersView.as_view(), name="room-members"),
    path("rooms/<uuid:room_id>/members/<uuid:user_id>/", RoomMemberDetailView.as_view(), name="room-member-detail"),
    path("rooms/<uuid:room_id>/messages/", RoomMessagesView.as_view(), name="room-messages"),

    # Message edit / delete (own messages)
    path("messages/<uuid:msg_id>/", MessageDetailView.as_view(), name="message-detail"),
    path("messages/<uuid:msg_id>/react/", MessageReactionView.as_view(), name="message-reaction"),

    # Admin-managed groups
    path("groups/", ChatGroupListCreateView.as_view(), name="group-list-create"),
    path("groups/<uuid:thread_id>/messages/", ChatGroupMessagesView.as_view(), name="group-messages"),

    # Institution teachers group (legacy endpoints)
    path("teacher-group/", TeacherGroupThreadView.as_view(), name="teacher-group-thread"),
    path("teacher-group/messages/", TeacherGroupMessagesView.as_view(), name="teacher-group-messages"),
    path("teacher-group/members/", TeacherGroupMembersView.as_view(), name="teacher-group-members"),

    # Threads and members (existing admin endpoints)
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