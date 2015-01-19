# -*- coding: utf-8 -*-
from south.utils import datetime_utils as datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models


class Migration(SchemaMigration):

    def forwards(self, orm):
        # Adding model 'ModelOwner'
        db.create_table(u'ThreeDTagging_modelowner', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('creation_date', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
        ))
        db.send_create_signal(u'ThreeDTagging', ['ModelOwner'])

        # Adding model 'ThreeDModel'
        db.create_table(u'ThreeDTagging_threedmodel', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('owner', self.gf('django.db.models.fields.related.ForeignKey')(related_name='owner', to=orm['ThreeDTagging.ModelOwner'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('pub_date', self.gf('django.db.models.fields.DateTimeField')(default=datetime.datetime.now)),
        ))
        db.send_create_signal(u'ThreeDTagging', ['ThreeDModel'])

        # Adding model 'POI'
        db.create_table(u'ThreeDTagging_poi', (
            (u'id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('threeDModel', self.gf('django.db.models.fields.related.ForeignKey')(related_name='model', to=orm['ThreeDTagging.ThreeDModel'])),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=255)),
            ('description', self.gf('django.db.models.fields.TextField')()),
            ('x', self.gf('django.db.models.fields.IntegerField')()),
            ('y', self.gf('django.db.models.fields.IntegerField')()),
            ('z', self.gf('django.db.models.fields.IntegerField')()),
            ('pinx', self.gf('django.db.models.fields.IntegerField')()),
            ('piny', self.gf('django.db.models.fields.IntegerField')()),
            ('pinz', self.gf('django.db.models.fields.IntegerField')()),
            ('isPublic', self.gf('django.db.models.fields.BooleanField')()),
        ))
        db.send_create_signal(u'ThreeDTagging', ['POI'])


    def backwards(self, orm):
        # Deleting model 'ModelOwner'
        db.delete_table(u'ThreeDTagging_modelowner')

        # Deleting model 'ThreeDModel'
        db.delete_table(u'ThreeDTagging_threedmodel')

        # Deleting model 'POI'
        db.delete_table(u'ThreeDTagging_poi')


    models = {
        u'ThreeDTagging.modelowner': {
            'Meta': {'object_name': 'ModelOwner'},
            'creation_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'})
        },
        u'ThreeDTagging.poi': {
            'Meta': {'object_name': 'POI'},
            'description': ('django.db.models.fields.TextField', [], {}),
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'isPublic': ('django.db.models.fields.BooleanField', [], {}),
            'pinx': ('django.db.models.fields.IntegerField', [], {}),
            'piny': ('django.db.models.fields.IntegerField', [], {}),
            'pinz': ('django.db.models.fields.IntegerField', [], {}),
            'threeDModel': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'model'", 'to': u"orm['ThreeDTagging.ThreeDModel']"}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'x': ('django.db.models.fields.IntegerField', [], {}),
            'y': ('django.db.models.fields.IntegerField', [], {}),
            'z': ('django.db.models.fields.IntegerField', [], {})
        },
        u'ThreeDTagging.threedmodel': {
            'Meta': {'object_name': 'ThreeDModel'},
            u'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '255'}),
            'owner': ('django.db.models.fields.related.ForeignKey', [], {'related_name': "'owner'", 'to': u"orm['ThreeDTagging.ModelOwner']"}),
            'pub_date': ('django.db.models.fields.DateTimeField', [], {'default': 'datetime.datetime.now'})
        }
    }

    complete_apps = ['ThreeDTagging']