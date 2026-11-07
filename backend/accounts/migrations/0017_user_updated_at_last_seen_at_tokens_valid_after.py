import django.utils.timezone
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0016_user_grade"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="updated_at",
            field=models.DateTimeField(auto_now=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name="user",
            name="last_seen_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
        migrations.AddField(
            model_name="user",
            name="tokens_valid_after",
            field=models.DateTimeField(
                blank=True,
                null=True,
                help_text=(
                    "Access JWTs issued before this instant are rejected, so revoking a "
                    "session kills outstanding access tokens too (see accounts/jwt_auth.py)."
                ),
            ),
        ),
    ]
