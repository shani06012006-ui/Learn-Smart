from django.urls import path

from .views import CancelLeaveView, LeaveSummaryView, MyLeavesView

app_name = "leaves"

urlpatterns = [
    path("my/", MyLeavesView.as_view(), name="my-leaves"),
    path("<uuid:leave_id>/cancel/", CancelLeaveView.as_view(), name="cancel-leave"),
    path("summary/", LeaveSummaryView.as_view(), name="leave-summary"),
]
