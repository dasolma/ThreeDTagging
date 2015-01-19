from django.conf.urls import patterns, include, url
from django.contrib.staticfiles.urls import staticfiles_urlpatterns
from views import *
from django.contrib import admin
from rest_framework import routers
from rest_framework.urlpatterns import format_suffix_patterns
admin.autodiscover()



urlpatterns = patterns('',
    url(r'^$', 'ThreeDTagging.views.viewer', name='home'),
    url(r'getPois/object=(?P<object_name>.+)',
                        'ThreeDTagging.views.getPOIS', name='getpois'),

    url(r'^poi/object=.+$', PoiView.as_view(), name='api_poi_get'),
    url(r'^poi/$', PoiView.as_view(), name='api_poi'),

    url(r'^models/$', ThreeDModelView.as_view(), name='api_models'),

    url(r'^admin/', include(admin.site.urls)),

    url(r'^api-auth/', include('rest_framework.urls', namespace='rest_framework'))
)

urlpatterns += staticfiles_urlpatterns()
urlpatterns = format_suffix_patterns(urlpatterns)