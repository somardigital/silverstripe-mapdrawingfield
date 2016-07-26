(function($) {
  
  var gmapsAPILoaded = false;

  //Initialises the map
  function initField() {

    var map;
    var drawingManager;
    var polygon;
    var otherPolygons = [];
    var field = $(this);
    var pathField = field.find('textarea');

    if(field.data('gmapfield-inited') === true) {
      return;
    }
    field.data('gmapfield-inited', true);

    // field = $('.mapdrawingfield').find('textarea');

    var settings = JSON.parse(field.attr('data-settings'));
    map = new google.maps.Map(document.getElementById('map'), {
        streetViewControl: false,
        zoom: settings.map.zoom * 1,
        disableDoubleClickZoom: true,
        center: new google.maps.LatLng(settings.map.coords[0], settings.map.coords[1])
    });

    initOtherShapes();

    if(!settings.readonly){
      if(!initShape()){
        initDrawing();
      } else {
        initClearControl();
      }
    }

    //Adds drawing functionality to the map
    function initDrawing(){
      drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        polygonOptions: {
          fillColor: settings.map.colour,
          strokeColor: settings.map.colour
        }, 
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [ 
            google.maps.drawing.OverlayType.POLYGON
          ]
        }
      });
      drawingManager.setMap(map);


      drawingManager.addListener('polygoncomplete', function(shape){
        polygon = shape;
        polygon.setEditable(true);
        polygon.setDraggable(false);
        updateField(polygon);
        drawingManager.setMap(null);

        setEditListeners(polygon);

        initClearControl();
      });
    }

    //Adds an existing polygon to the map, setting it as the center and zooming so it is all visible
    function initShape(){
      if(!pathField.val().length){
        return false;
      }

      points = pathField.val().split('\n');

      objPoints = [];
      points.map(function(point){
        coords = point.split(', ');
        lat = coords[0];
        lng = coords[1];
        objPoints.push(new google.maps.LatLng(lat, lng));
      });

      polygon = new google.maps.Polygon({
          paths: objPoints,
          draggable: false,
          editable: true,
          fillColor: settings.map.colour,
          strokeColor: settings.map.colour
      });
      polygon.setMap(map);

      setEditListeners(polygon);

      center = getPolygonCenter(polygon);
      map.setCenter(center);
      map.fitBounds(getPolygonBounds(polygon));

      return true;
    }

    function initOtherShapes(){
      var shapes = settings.shapes
      console.log(shapes);
      var bounds = new google.maps.LatLngBounds(); 
      
      if(shapes instanceof Object && Object.keys(shapes).length > 0){
        for(id in shapes){
          var shape = shapes[id];

          points = shape.coords.split('\n');

          objPoints = [];
          points.map(function(point){
            coords = point.split(', ');
            lat = coords[0];
            lng = coords[1];
            objPoints.push(new google.maps.LatLng(lat, lng));
          });

          otherPoly = new google.maps.Polygon({
              paths: objPoints,
              strokeColor: shape.colour,
              fillColor: shape.colour
          });
          otherPoly.setMap(map);
          otherPolygons.push(polygon);

          //add polygon to big bounds object
          var paths;
          paths = otherPoly.getPath();

          for(var i = 0; i < paths.length; i++){
              points = new google.maps.LatLng(paths.getAt(i).lat(), paths.getAt(i).lng());
              bounds.extend(points);                  
          }
        }
        if(settings.map.marker.length > 0){
          var pos = new google.maps.LatLng(settings.map.marker[0], settings.map.marker[1])
          var marker = new google.maps.Marker({
              position: pos,
              map: map
          });
          map.setCenter(pos);
          map.setZoom(11);
        } else if(settings.readonly){
          map.fitBounds(bounds);  
          map.setCenter(bounds.getCenter());
        }

      }
    }
    

    function setEditListeners(poly){
      google.maps.event.addListener(poly.getPath(), 'insert_at', function(event){
          updateField(poly);
      });
      google.maps.event.addListener(poly.getPath(), 'set_at', function(event){
          updateField(poly);
      });

      /**
     * A menu that lets a user delete a selected vertex of a path.
     * @constructor
     */
    function DeleteMenu() {
      this.div_ = document.createElement('div');
      this.div_.className = 'delete-menu';
      this.div_.innerHTML = 'Delete';
      this.div_.style.position = 'absolute';
      this.div_.style.background = '#fff';
      this.div_.style.cursor = 'pointer'
      this.div_.style.padding = '3px'
      this.div_.style.border = '1px solid black'

      var menu = this;

      google.maps.event.addDomListener(this.div_, 'click', function() {
        menu.removeVertex();
        updateField(menu.poly);
      });
    }
    DeleteMenu.prototype = new google.maps.OverlayView();

    DeleteMenu.prototype.onAdd = function() {
      var deleteMenu = this;
      var map = this.getMap();
      this.getPanes().floatPane.appendChild(this.div_);

      // mousedown anywhere on the map except on the menu div will close the
      // menu.
      this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(e) {
        if (e.target != deleteMenu.div_) {
          deleteMenu.close();
        }
      }, true);
    };

    DeleteMenu.prototype.onRemove = function() {
      google.maps.event.removeListener(this.divListener_);
      this.div_.parentNode.removeChild(this.div_);

      // clean up
      this.set('position');
      this.set('path');
      this.set('vertex');
    };

    DeleteMenu.prototype.close = function() {
      this.setMap(null);
    };

    DeleteMenu.prototype.draw = function() {
      var position = this.get('position');
      var projection = this.getProjection();

      if (!position || !projection) {
        return;
      }

      var point = projection.fromLatLngToDivPixel(position);
      this.div_.style.top = point.y + 'px';
      this.div_.style.left = point.x + 'px';
    };

    /**
     * Opens the menu at a vertex of a given path.
     */
    DeleteMenu.prototype.open = function(map, path, vertex) {
      this.set('position', path.getAt(vertex));
      this.set('path', path);
      this.set('vertex', vertex);
      this.setMap(map);
      this.draw();
    };

    /**
     * Deletes the vertex from the path.
     */
    DeleteMenu.prototype.removeVertex = function() {
      var path = this.get('path');
      var vertex = this.get('vertex');

      if (!path || vertex == undefined) {
        this.close();
        return;
      }

      path.removeAt(vertex);
      this.close();
    };

      var deleteMenu = new DeleteMenu();

      google.maps.event.addListener(poly, 'rightclick', function(e) {
        // Check if click was on a vertex control point
        if (e.vertex == undefined) {
          return;
        }
        deleteMenu.poly = poly
        deleteMenu.open(map, poly.getPath(), e.vertex);
      });
    }

    



    //Adds a clear map control to the map
    function initClearControl(){
      var controlHolder = document.createElement('div');
      var control = new ClearMapControl(controlHolder, map);

      controlHolder.index = 1;

      $(control).appendTo('.mapdrawingfield');
    }

    //Creates a Clear Map control
    function ClearMapControl(controlDiv, map) {
      // Set CSS for the control border.
      var controlUI = document.createElement('div');
      controlUI.style.backgroundColor = '#fff';
      controlUI.style.border = '2px solid #fff';
      controlUI.style.borderRadius = '3px';
      controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
      controlUI.style.cursor = 'pointer';
      controlUI.style.marginBottom = '22px';
      controlUI.style.textAlign = 'center';
      controlUI.style.width = '200px';
      controlUI.style.margin = '20px auto auto 0px';
      controlUI.style.display = 'block';
      controlUI.title = 'Click to clear the map';
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior.
      var controlText = document.createElement('div');
      controlText.style.color = 'rgb(25,25,25)';
      controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
      controlText.style.fontSize = '16px';
      controlText.style.lineHeight = '38px';
      controlText.style.paddingLeft = '5px';
      controlText.style.paddingRight = '5px';
      controlText.innerHTML = 'Clear Map';
      controlUI.appendChild(controlText);

      // Setup the click event listeners
      controlUI.addEventListener('click', function() { 
        clearMap();
      });

      return controlUI;
    }

    //Clears the map of polygon and allows drawing
    function clearMap(){
        polygon.setMap(null);
        pathField.val('');
        initDrawing();
        map.controls[google.maps.ControlPosition.TOP_CENTER].clear();
    }

    //Updates the hidden text field with the shape paths
    function updateField(poly){
        var points = [];

        poly.getPaths().getArray()[0].forEach(function(e, i){
          var stringLatLng = e.toString();
          points.push(stringLatLng.substring(1, stringLatLng.length-1));
        });
        
        pathField.val(points.join('\n'));
    }

    function removeVertex(poly, vertex) {
      var path = poly.getPath();
      path.removeAt(vertex);
    }

    //Get the bounds of a polygon
    function getPolygonBounds(poly){
        var bounds = new google.maps.LatLngBounds()
        poly.getPath().forEach(function(element,index){bounds.extend(element)})
        return bounds;
    }

    //Gets the center of a polygon
    function getPolygonCenter(poly){
        var bounds = getPolygonBounds(poly);
        return bounds.getCenter();
    }
    google.maps.event.trigger(map, 'resize');
    map.setZoom( map.getZoom() );
  }

  $.fn.mapdrawingfield = function() {
    return this.each(function() {
      initField.call(this);
    });
  }

  // Export the init function
  window.mapdrawInit = function() {
    gmapsAPILoaded = true;
    init();
  }

  function init() {
    var mapFields = $('.mapdrawingfield:visible').mapdrawingfield();
    mapFields.each(initField);
  }

  //This will reload the map when the region is saved - pulled from BetterBrief/silverstripe-googlemapfield
  if(!!$.fn.entwine && $(document.body).hasClass('cms')) {
    (function setupCMS() {
      var matchFunction = function() {
        if(gmapsAPILoaded){
          init();
        }
      };
      $.entwine('mapdrawingfield', function($) {
        $('.cms-tabset').entwine({
          onmatch: matchFunction
        });
        $('.cms-tabset-nav-primary li').entwine({
          onclick: matchFunction
        });
        $('.ss-tabset li').entwine({
          onclick: matchFunction
        });
        $('.cms-edit-form').entwine({
          onmatch: matchFunction
        });
      });
    }());
  }
}(jQuery));


