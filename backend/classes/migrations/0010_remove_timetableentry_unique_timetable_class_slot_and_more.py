

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('classes', '0009_remove_timetableentry_unique_timetable_class_slot_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='classcourse',
            name='section',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='class_courses',
                to='classes.classsection',
            ),
        ),
    ]
