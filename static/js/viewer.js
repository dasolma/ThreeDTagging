var container, stats;

var camera, scene, renderer, lightsGroup;
var directionalLight;
var mouseX = 0, mouseY = 0;

var windowHalfX = window.innerWidth / 2;
var windowHalfY = window.innerHeight / 2;

var mesh;
var objects = [];
var pois = new POIList();
var showedPopups = [];
var raycaster;
var leftButtonDown = false;
var modelfilename = "";

// using jQuery
function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
var csrftoken = getCookie('csrftoken');

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}
$.ajaxSetup({
    beforeSend: function(xhr, settings) {
        if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
            xhr.setRequestHeader("X-CSRFToken", csrftoken);
        }
    }
});

function POIList() {
  this.pois = []
  this.lastPOI = null;

  this.add = function(poi) {
   	 this.pois.push(poi);
  }

  this.remove = function(poi) {

    scene.remove( poi.pin );
    $(poi.popup).remove();
    this.pois.splice(this.pois.indexOf(poi),1);

  }
  this.getPINS = function() {
	var pins = [];

	for(var i in this.pois) {
		pins.push( this.pois[i].pin );
	}

	return pins;
  }

  this.mouseOver = function(x, y) {
    var intersects = getIntersects( x, y, this.getPINS() );
	
	if ( intersects.length > 0 ) {
		
		intersects[ 0 ].object.material.color.setHex( 0x00ff00 );
		this.lastPOI = intersects[ 0 ].object;
	}
	else if (this.lastPOI != null) {
		this.lastPOI.material.color.setHex( 0xcc0000 );
		this.lastPOI = null;
	}
  }

  this.getPOI = function(x, y) {

	var intersects = getIntersects( x, y, this.getPINS() );

    if ( intersects.length > 0 ) {

        var pin = intersects[ 0 ].object;

        for(var i in this.pois) {
            if( pin == this.pois[i].pin ) {

                return this.pois[i];
            }
        }

	}

	return null;
  }

  this.hidePopups = function() {
	$('.popup').remove();

	for(var i in this.pois) {

        if( this.pois[i].isnew ) {
            this.remove( this.pois[i] );
        }
        else {
            this.pois[i].popup = null;
        }
    }

  }

  this.load = function() {

      $.ajax({
        type: "GET",
        url: '/poi/?object=' + modelfilename ,

        }).done(function( data ) {
            for(i in data) {
                var pin = new THREE.Vector3(data[i].x, data[i].y,data[i].z);
                var pinPoint = new THREE.Vector3(data[i].pinx, data[i].piny,data[i].pinz);
                var poi = new POI(data[i].title, data[i].description, pin, pinPoint, false, true);

                poi.drawBallon( scene );

		        pois.add( poi );


		    }

        });

  }

  this.isediting = function() {
    for(var i in this.pois) {
        if( this.pois[i].isediting ) {
            return true;
        }
    }

    return false;
  }

}

function POI(title, desc, point, pintPoint, isnew, canedit) {
  this.title = title;
  this.description = desc;
  this.point = point;
  this.pinPoint = pintPoint;
  this.visible = false;
  this.pin = null;
  this.popup = null;
  this.isnew = typeof isnew !== 'undefined' ? isnew : true;
  this.canedit = typeof canedit !== 'undefined' ? canedit : true;
  this.isediting = this.isnew;

  this.drawBallon = function(scene) {

	
	var particle = new THREE.Sprite( particleMaterial );
	particle.position.copy( this.point );
	particle.scale.x = particle.scale.y = 16;

	// set up the sphere vars
	var radius = 1,
	    segments = 16,
	    rings = 16;

	// create the sphere's material

	var pinMaterial =
	  new THREE.MeshLambertMaterial(
	    {
	      color: 0xCC0000,  shading: THREE.FlatShading
	    });

	var sg = new THREE.SphereGeometry(2.5,100,40);

	var cg = new THREE.Mesh(new THREE.CylinderGeometry(0, 2.28, 4, 100, 40, false), pinMaterial);
	cg.position.add( new THREE.Vector3(0,3,0) );
	THREE.GeometryUtils.merge(sg,cg);
	this.pin = new THREE.Mesh( sg, pinMaterial );

	this.pin.overdraw = true;

	this.pin.position.copy( this.pinPoint );
	//this.pin.position.add( this.intersect.face.normal.multiplyScalar(5) );


	this.pin.lookAt( this.point );
	this.pin.rotateOnAxis( new THREE.Vector3(1,0,0), 90 );

		
	scene.add( this.pin );

	

  }

  this.showInfo = function(x, y, edit) {
	var title = this.title;
	var description = this.description

	var display = this.canedit ? "" : ";display:none;";

	this.popup = $("<div class='popup'>" +
		        "<span class='popover' style='position:absolute;left:" + (x + 40) +"px;top:" + y + 	"px;min-width:40%'>" +
 			  "<img src='/static/images/edit.png' style='float:right" +  display + "' id='edit' class='button'  />" +
			  "<div class='title' >" + title + "</div>" + 
		          "<div class='description'>" + description + "</div>"+ 
			"</span></div>");

	$(this.popup).mouseover(function(){
		controls.enabled = false;
	});

	$(this.popup).mouseleave(function(){
		controls.enabled = true;
	});

	$(this.popup).find('#edit').bind("click", { poi: this }, function(event) {
	    event.data.poi.edit();

        /*
		$(this).slideUp();
        	$(this).parent().find(".title").replaceWith("<div class='title'><input type='text' value='" + event.data.poi.title + "' style='width:95%'/></div>");
		$(this).parent().find(".description").replaceWith("<div class='description'><textarea style='width:100%' rows='5' >" +  event.data.poi.description + "</textarea></div>");

		var btnCancel = $("<input type='button' value='Cancel' />");
		var btnAccept = $("<input type='button' value='Accept' />");
		var buttons = $("<div class='buttons' style='float:right'></div>");


		btnCancel.bind("click", { poi: event.data.poi }, function(event) { event.data.poi.unedit(event, $(this).parent().parent()); });
		btnAccept.bind("click", { poi: event.data.poi  },  function(event) { event.data.poi.accept(event, $(this).parent().parent()); });

		buttons.append(btnCancel);
		buttons.append(btnAccept);

		$(this).parent().append(buttons);
        */
    });


	$("body").append(this.popup);
  }


  this.edit = function() {
        $(this.popup).find("#edit").slideUp();
            $(this.popup).find(".title").replaceWith("<div class='title'><input type='text' value='" + this.title + "' style='width:95%'/></div>");
        $(this.popup).find(".description").replaceWith("<div class='description'><textarea style='width:100%' rows='5' >" +  this.description + "</textarea></div>");

        var btnCancel = $("<input type='button' value='Cancel' />");
        var btnAccept = $("<input type='button' value='Accept' />");
        var buttons = $("<div class='buttons' style='float:right'></div>");


        btnCancel.bind("click", { poi: this }, function(event) { event.data.poi.cancel(event); });
        btnAccept.bind("click", { poi: this  },  function(event) { event.data.poi.accept(event); });

        buttons.append(btnCancel);
        buttons.append(btnAccept);

        $(this.popup).find(".popover").append(buttons);
        this.isediting = true;

  }

  this.accept = function (event) {

     var title = this.popup.find('.title').find('input').val();
     var desc = this.popup.find('.description').find('textarea').val();
     this.title = title;
     this.description = desc;

     data =  {
              object:modelfilename,
              title: this.title,
              description: this.description,
              x: this.point.x,
              y: this.point.y,
              z: this.point.z,
              pinx : this.pinPoint.x,
              piny : this.pinPoint.y,
              pinz : this.pinPoint.z,
              isPublic : true,

            };

     data = JSON.stringify(data);


     $.ajax({

        type: this.isnew ? "POST" : "PUT",
        dataType: "json",
        url: '/poi/',
        data: data,
        contentType:"application/json; charset=utf-8",

        });

     this.isnew = false;

     this.unedit(event);
  }

  this.unedit = function (event) {

     this.popup.find('.title').replaceWith("<div class='title'>" + this.title + "</div>");
     this.popup.find('.description').replaceWith("<div class='description'>" + this.description + "</div>");
    
     this.popup.find('.buttons').remove();
     this.popup.find('.button').slideDown();

     this.isediting = false;
  }

  this.cancel = function (event) {
    if( this.isnew ) {
        controls.enabled = true;
        pois.remove(this);
    }

    this.unedit(event);
  }

}

$(window).resize(function(){
  $('#loading').css({
    position:'absolute',
    left: ($(window).width() - $('#loading').outerWidth())/2,
    top: ($(window).height() - $('#loading').outerHeight())/2
  });
});

// To initially run the function:
$(window).resize();

$(window).ready(function() {
  $('#loading').css({
    position:'absolute',
    left: ($(window).width() - $('#loading').outerWidth())/2,
    top: ($(window).height() - $('#loading').outerHeight())/2
  });
});

function GetURLParameter(sParam)
{
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) 
	{
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) 
		{
			return decodeURIComponent(sParameterName[1]);
		}
	}
}

function init() {

	container = document.createElement( 'div' );
        $(container).css("display","none");
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 10, 20000 );
	camera.position.z = 100;

	controls = new THREE.TrackballControls( camera );
	controls.rotateSpeed = 5.0;
	controls.zoomSpeed = 5;
	controls.panSpeed = 2;
	controls.noZoom = false;
	controls.noPan = false;
	controls.staticMoving = true;
	controls.dynamicDampingFactor = 0.3;

	// scene

	scene = new THREE.Scene();

	// var ambient = new THREE.AmbientLight( 0x101030 );
	var ambient = new THREE.AmbientLight( 0x101030 );
	scene.add( ambient );

	// directional lighting
	directionalLight = new THREE.DirectionalLight(0xffffff);
	directionalLight.position.set(200, 400, 500);

	var directionalLight2 = new THREE.DirectionalLight(0xffffff);
	directionalLight2.position.set(-400, 200, -300);

	var hemisphereLight = new THREE.HemisphereLight(0x101030, 0xffffff, 0.6);

	lightsGroup = new THREE.Object3D();//create an empty container
	
	lightsGroup.add(directionalLight);
	lightsGroup.add(directionalLight2);
	//lightsGroup.add(hemisphereLight);

	// model
	var modelfile = GetURLParameter('model');
	modelfilename = modelfile.replace(/^.*[\\\/]/, '')

	var ext = modelfile.split('.').pop();
	switch (ext) {
		case 'obj':
			var mtl = GetURLParameter('material');

			if (mtl || true) {

			    var loader = new THREE.OBJMTLLoader();
			    loader.load(modelfile, mtl, function ( object ) {
                                mesh = object;
                                
                                minx = miny = minz = 99999999
                                maxx = maxy = maxz = -99999999   
			        for(i = 0; i < object.children.length; i++)
                                {
				  geometry = object.children[i].geometry;
				  geometry.computeBoundingBox();
                                     
                                  minx = Math.min(minx, geometry.boundingBox.min.x);	
                                  miny = Math.min(miny, geometry.boundingBox.min.y);	
                                  minz = Math.min(minz, geometry.boundingBox.min.z);	
                                  maxx = Math.max(maxx, geometry.boundingBox.max.x);	
                                  maxy = Math.max(maxy, geometry.boundingBox.max.y);	
                                  maxz = Math.max(maxz, geometry.boundingBox.max.z);	
                                }

				var centerX =  minx + 0.5 * ( maxx - minx );
				var centerY =  miny + 0.5 * ( maxy - miny );
				var centerZ =  minz + 0.5 * ( maxz - minz );
			    
				object.position.add( new THREE.Vector3( -centerX, -centerY, -centerZ ) );
                                //alert(object.position.x);
			        //controls.target.set(centerX, centerY, centerZ);      
                                //scene.add( geometry.boundingBox );	
				//scene.add( new THREE.BoxHelper( object.children[2] ) );
				//scene.add( new THREE.WireframeHelper( object.children[2] ) );﻿
			        scene.add( object );
				
				objects.push(object);
                                $(container).css("display", "");
                                $("#loading").remove();
			    } );
				
			}
			else {

			    var texture	 = new THREE.Texture();
			    
			    var loader = new THREE.ImageLoader();
			    loader.load( 'UV_Grid_Sm.jpg', function ( event ) {

				texture.image = event.content;
				texture.needsUpdate = true;
				texture.magFilter = THREE.NearestFilter;
				texture.minFilter = THREE.NearestMipMapLinearFilter;

			    } );
                            
			    var loader = new THREE.OBJLoader();
	
			   loader.load( modelfile,  function ( event ) {

				var object = event.content;

				object.traverse( function ( child ) {

					if ( child instanceof THREE.Mesh ) {

						child.material.map = texture;

					}

				} );

				//object.scale = new THREE.Vector3( 25, 25, 25 );
				scene.add( object );
				objects.push(object);

			   });
			}
	
			lightsGroup.add(hemisphereLight);
			break;
		case 'js':

			var loader = new THREE.BinaryLoader();
		 		
			loader.load( modelfile, function( data, materials ) {
				if (data instanceof THREE.Geometry)
				{
					var geometry = data;

					// Just in case model doesn't have normals
					geometry.computeVertexNormals();

					var material = new THREE.MeshLambertMaterial({color: 'white'})
					var mesh = new THREE.Mesh( geometry, materials[0]  );
					scene.add( mesh );
					objects.push(mesh);

                                        $(container).css("display", "");
                                        $("#loading").remove();
				} 
			} );	
		
			lightsGroup.add(directionalLight);
			lightsGroup.add(directionalLight2);	
			break
	}

	scene.add(lightsGroup);
	//

	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	var PI2 = Math.PI * 2;
	particleMaterial = new THREE.PointCloudMaterial( {

		color: 0x000000,
		size: 20,
		program: function ( context ) {


		}

	} );


	raycaster = new THREE.Raycaster();

	document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	document.addEventListener( 'mousedown', onDocumentMouseDown, false );
	document.addEventListener( 'mouseup', onDocumentMouseUp, false );
	document.addEventListener( 'dblclick', onDblclick, false );


	window.addEventListener( 'resize', onWindowResize, false );

	pois.load();

}

function onWindowResize() {

	windowHalfX = window.innerWidth / 2;
	windowHalfY = window.innerHeight / 2;

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseDown(e){
	// Left mouse button was pressed, set flag
	if(e.which === 1) leftButtonDown = true;
}

function onDocumentMouseUp(e){
	// Left mouse button was released, clear flag
	if(e.which === 1) leftButtonDown = false;
}

function tweakMouseMoveEvent(e){
	

	// If left button is not set, set which to 0
	// This indicates no buttons pressed
	if(e.which === 1 && !leftButtonDown) e.which = 0;
}



function onDocumentMouseMove( event ) {
	// Call the tweak function to check for LMB and set correct e.which
	tweakMouseMoveEvent(event);

	mouseX = ( event.clientX - windowHalfX ) / 2;
	mouseY = ( event.clientY - windowHalfY ) / 2;

	event.preventDefault();
	var x = ( event.clientX / window.innerWidth ) * 2 - 1;
	var y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	pois.mouseOver( x, y);

	if (leftButtonDown && controls.enabled) {
		pois.hidePopups();
	}

	
}


function animate() {

	requestAnimationFrame( animate );
	render();
}

function getIntersects( x, y, objectList ) {	

	var vector = new THREE.Vector3();
			vector.set( x, y, 0.5 );
	vector.unproject( camera );

	raycaster.ray.set( camera.position, vector.sub( camera.position ).normalize() );

	var intersects = raycaster.intersectObjects( objectList );

	return intersects;
}

function onDblclick( event ){

	event.preventDefault();

	var x = ( event.clientX / window.innerWidth ) * 2 - 1;
	var y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	var poi = pois.getPOI(x, y);
	if( poi != null  ) {
	    if (poi.popup == null )
		    poi.showInfo(event.clientX, event.clientY);
	}
	else {
	    if ( !pois.isediting() ) {
            var poi = createPOI(event);
            poi.showInfo(event.clientX, event.clientY);
            poi.edit();

        }
	}


}

function createPOI(event) {
	var x = ( event.clientX / window.innerWidth ) * 2 - 1;
	var y = - ( event.clientY / window.innerHeight ) * 2 + 1;

	var intersects = getIntersects( x, y, objects[0].children );

	if ( intersects.length > 0 ) {
	    var point = new THREE.Vector3(intersects[ 0 ].point.x, intersects[ 0 ].point.y, intersects[ 0 ].point.z);
	    var pinPoint = new THREE.Vector3(intersects[ 0 ].point.x, intersects[ 0 ].point.y, intersects[ 0 ].point.z);
	    pinPoint.add( intersects[0].face.normal.multiplyScalar(5) );

		var poi = new POI("Ttile", "Description...", point, pinPoint);
		poi.drawBallon( scene );

		pois.add( poi );			
        return poi;
	}
}



function render() {

	controls.update();
	
	renderer.render( scene, camera );
}

init();
animate();
