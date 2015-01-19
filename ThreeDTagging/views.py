__author__ = 'dasolma'

# -*- coding: utf-8 -*-
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse
import json
from models import *
from rest_framework.decorators import api_view
from rest_framework.renderers import JSONRenderer
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.parsers import JSONParser
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.csrf import ensure_csrf_cookie

from io import BytesIO

class JSONResponse(HttpResponse):
    """
    An HttpResponse that renders its content into JSON.
    """
    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)

@ensure_csrf_cookie
def viewer(request):
    return render_to_response('viewer.htm', locals(),
                     context_instance=RequestContext(request))


def getPOIS(request, object_name):

    pois = list(POI.objects.filter(threeDModel__name=object_name).values_list())
    json_posts = json.dumps(pois)

    return HttpResponse(json_posts, content_type="application/json")


class PoiView(APIView):

    def get(self, request, format=None):
        try:
          object_name = str(request.GET.get('object'))

          if object_name == None or object_name == "None":
            poi = POI.objects.all()
          else:
            poi = POI.objects.filter(threeDModel__name=object_name)
          #poi = POI.objects.all()


          serializer = POISerializer(poi, many=True)

          return JSONResponse(serializer.data)
        except:
          response_data = {}
          response_data['result'] = 'error'
          response_data['message'] = 'not found'

          return JSONResponse(response_data)


    '''
    { "title":"test", "description":"adlkfja", "x":"1", "y":"2", "z":"3", "pinx":"1", "piny":"2", "pinz":"3", "isPublic":"true", "object":"askldjf" }
    '''
    def post(self, request,  format=None):
        strdata =  json.dumps(request.data)
        #return JSONResponse({ "Datos":strdata})
        stream = BytesIO(strdata)
        data = JSONParser().parse(stream)

        try:

            objs = ThreeDModel.objects.filter(name=data['object'])
            if len(objs) == 0:
                 try:
                    owner = ModelOwner.objects.get(name="guest")

                 except:

                    owner = ModelOwner()
                    owner.name = "guest"
                    owner.save()

                 obj = ThreeDModel()
                 obj.name = data['object']
                 obj.owner = owner
                 obj.save()

            else:
                obj = objs[0]


        except:

            try:
                owner = ModelOwner.objects.get(name="guest")
            except:

                owner = ModelOwner()
                owner.name = "guest"
                owner.save()

            obj = ThreeDModel()
            obj.name = data['object']
            obj.owner = owner
            obj.save()

        data["threeDModel"] = obj.id

        serializer = POISerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return JSONResponse(serializer.data, status=201)

        return JSONResponse(serializer.errors, status=400)


    def put(self, request,  format=None):
        strdata =  json.dumps(request.data)
        stream = BytesIO(strdata)
        data = JSONParser().parse(stream)

        poi = POI.objects.get(threeDModel__name=data['object'], x=data['x'],y=data['y'],z=data['z'],)
        data["threeDModel"] = poi.threeDModel.id
        serializer = POISerializer(poi, data=data)
        if serializer.is_valid():
            serializer.save()
            return JSONResponse(serializer.data)

        return JSONResponse(serializer.errors, status=400)


class ThreeDModelView(APIView):

    def get(self, request, format=None):
        try:

          poi = ThreeDModel.objects.all()

          serializer = ThreeDModelSerializer(poi, many=True)

          return JSONResponse(serializer.data)
        except:
          response_data = {}
          response_data['result'] = 'error'
          response_data['message'] = 'not found'

          return JSONResponse(response_data)
