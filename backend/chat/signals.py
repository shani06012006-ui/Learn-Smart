# -*- coding: utf-8 -*-
"""
Signals to keep chat membership in sync with class enrollments.

- ClassCourse created -> ensure a group Thread exists for it
- StudentEnrollment created / activated -> add student to the class thread
- StudentEnrollment removed / blocked -> remove student from the thread
- StudentEnrollment deleted -> remove student from the thread
"""
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from classes.models import ClassCourse, StudentEnrollment
from .models import Thread, ThreadMember


def _ensure_group_thread(class_course):
    """Idempotently create the group chat for a class."""
    thread, _ = Thread.objects.get_or_create(
        class_course=class_course,
        defaults={
            "institution": class_course.institution,
            "kind": Thread.KIND_GROUP,
            "title": class_course.name,
            "created_by": class_course.teacher,
        },
    )
    # Teacher is always a member
    if class_course.teacher_id:
        ThreadMember.objects.get_or_create(thread=thread, user=class_course.teacher)
    return thread


@receiver(post_save, sender=ClassCourse)
def class_course_saved(sender, instance, **kwargs):
    try:
        _ensure_group_thread(instance)
    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "chat thread creation failed for class %s", instance.id
        )


@receiver(post_save, sender=StudentEnrollment)
def enrollment_saved(sender, instance, **kwargs):
    try:
        thread = _ensure_group_thread(instance.class_course)
        if instance.status == StudentEnrollment.STATUS_ACTIVE:
            ThreadMember.objects.get_or_create(thread=thread, user=instance.student)
        else:
            ThreadMember.objects.filter(thread=thread, user=instance.student).delete()
    except Exception:
        import logging
        logging.getLogger(__name__).exception(
            "chat membership sync failed for enrollment %s", instance.id
        )


@receiver(post_delete, sender=StudentEnrollment)
def enrollment_deleted(sender, instance, **kwargs):
    try:
        ThreadMember.objects.filter(
            thread__class_course=instance.class_course,
            user=instance.student,
        ).delete()
    except Exception:
        pass