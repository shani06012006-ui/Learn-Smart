from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0011_pendingregistration_passwordresettoken_purpose_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='temp_password_expires_at',
            field=models.DateTimeField(
                blank=True, 
                null=True, 
                help_text='Expiration timestamp for the temporary password if one was issued.'
            ),
        ),
    ]