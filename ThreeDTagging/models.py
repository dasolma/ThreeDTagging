__author__ = 'dasolma'

from django.db import models
from django.conf import settings
from django.utils import timezone
from django.forms import widgets
from rest_framework import serializers


class ModelOwner(models.Model):
    name = models.CharField(max_length=255)
    creation_date = models.DateTimeField(default=timezone.now)

class ThreeDModel(models.Model):
    owner = models.ForeignKey('ModelOwner', null=False, blank=False,
                        on_delete=models.CASCADE,
                        related_name="owner")

    name = models.CharField(max_length=255)
    pub_date = models.DateTimeField(default=timezone.now)

class POI(models.Model):

    threeDModel = models.ForeignKey('ThreeDModel', null=False, blank=False,
                        on_delete=models.CASCADE,
                        related_name="model")

    title = models.CharField(max_length=255)
    description = models.TextField()
    x = models.IntegerField()
    y = models.IntegerField()
    z = models.IntegerField()
    pinx = models.IntegerField()
    piny = models.IntegerField()
    pinz = models.IntegerField()
    isPublic = models.BooleanField()


# Serializers define the API representation.
class ThreeDModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = ThreeDModel
        fields = ('name', 'pub_date', 'id')


class POISerializer(serializers.ModelSerializer):
    class Meta:
        model = POI
        fields = ('title', 'description', 'x', 'y', 'z',
                  'pinx', 'piny', 'pinz', 'isPublic', 'threeDModel')
