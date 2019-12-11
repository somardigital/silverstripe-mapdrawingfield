(function($, window, document) {
  var gmapsAPILoaded = false;

  window.mapDrawingFieldInit = function() {
    gmapsAPILoaded = true;
    init();
  };

  $.fn.mapDrawingField = function() {
    return this.each(initField);
  };

  function init() {
    $(document).ready(function() {
      $('.mapdrawingfield:visible').mapDrawingField();
    });
  }

  function initField() {
    var $this = $(this);
    var $data = $this.find('textarea');
    var $holder = $this.find('.mapdrawingfield__holder');
    var $controls = $this.find('.mapdrawingfield__controls');
    var $clearControl = $controls.find('.mapdrawingfield__clear');
    var settings = $this.data('settings');
    var map, drawingManager, polygon, otherPolygons = [];

    if ($this.data('gmapfield-inited') === true) {
      return false;
    }

    $this.data('gmapfield-inited', true);

    initMap();
    initShape();
    initOtherShapes();
    initMarker();
    initDrawingManager();
    initControls();
    setBounds();

    function initMap() {
      map = new google.maps.Map($holder[0], {
        center: new google.maps.LatLng(settings.map.coords[0], settings.map.coords[1]),
        zoom: settings.map.zoom,
        controlSize: 24,
        streetViewControl: false,
        disableDoubleClickZoom: true
      });
    }

    function initShape() {
      if ($data.val().length === 0) {
        return false;
      }

      if (settings.readonly) {
        return false;
      }

      var points = normalisePoints($data.val().split('\n'));
      polygon = new google.maps.Polygon({
        paths: points,
        draggable: false,
        editable: true,
        fillColor: settings.map.colour,
        strokeColor: settings.map.colour
      });
      polygon.setMap(map);
      setPolygonEventListeners(polygon);
    }

    function initOtherShapes() {
      if (!settings.shapes || !$.isArray(settings.shapes)) {
        return false;
      }

      $.each(settings.shapes, function(index, shape) {
        var points = normalisePoints(shape.coords.split('\n'));
        var polygon = new google.maps.Polygon({
            paths: points,
            strokeColor: shape.colour || settings.map.colour,
            fillColor: shape.colour || settings.map.colour
        });
        polygon.setMap(map);
        otherPolygons.push(polygon);
      });
    }

    function initMarker() {
      if (settings.map.marker.length !== 2) {
        return false;
      }

      var position = new google.maps.LatLng(settings.map.marker[0], settings.map.marker[1]);
      var marker = new google.maps.Marker({
        position: position,
        map: map
      });

      map.setCenter(position);
    }

    function initDrawingManager() {
      if (settings.readonly) {
        return false;
      }

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

      drawingManager.addListener('polygoncomplete', function(shape) {
        polygon = shape;
        polygon.setEditable(true);
        polygon.setDraggable(false);

        updateData(polygon);
        setPolygonEventListeners(polygon);
        hideDrawingManager();
        showControls();
      });

      if (!polygon) {
        showDrawingManager();
      }
    }

    function initControls() {
      if (settings.readonly) {
        return false;
      }

      if (polygon) {
        showControls();
      }

      $clearControl.on('click', function() {
        clearMap();
        hideControls();
      });
    }

    function setPolygonEventListeners(polygon) {
      google.maps.event.addListener(polygon.getPath(), 'insert_at', function() {
        updateData(polygon);
      });

      google.maps.event.addListener(polygon.getPath(), 'set_at', function() {
        updateData(polygon);
      });

      google.maps.event.addListener(polygon.getPath(), 'remove_at', function() {
        updateData(polygon);
      });

      function DeleteMenu() {
        this.div_ = document.createElement('div');
        this.div_.className = 'delete-menu';
        this.div_.innerHTML = settings.labels.DELETEPOINT;
        this.div_.style.position = 'absolute';
        this.div_.style.backgroundColor = '#111';
        this.div_.style.color = '#fff';
        this.div_.style.cursor = 'pointer';
        this.div_.style.padding = '4px 8px';
        this.div_.style.borderRadius = '2px';
        this.div_.style.boxShadow = '0 1px 4px -1px rgba(0, 0, 0, 0.3)';
        this.div_.style.fontSize = '14px';

        var menu = this;

        google.maps.event.addDomListener(this.div_, 'click', function() {
          menu.removeVertex();
        });
      }

      DeleteMenu.prototype = new google.maps.OverlayView();

      DeleteMenu.prototype.onAdd = function() {
        var menu = this;
        var map = this.getMap();

        this.getPanes().floatPane.appendChild(this.div_);

        // Mousedown anywhere on the map except on the menu div will close the menu.
        this.divListener_ = google.maps.event.addDomListener(map.getDiv(), 'mousedown', function(e) {
          if (e.target != menu.div_) {
            menu.close();
          }
        }, true);
      };

      DeleteMenu.prototype.onRemove = function() {
        google.maps.event.removeListener(this.divListener_);
        this.div_.parentNode.removeChild(this.div_);

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
          return false;
        }

        var point = projection.fromLatLngToDivPixel(position);
        this.div_.style.top = (point.y + 5) + 'px';
        this.div_.style.left = (point.x + 5) + 'px';
      };

      DeleteMenu.prototype.open = function(map, path, vertex) {
        this.set('position', path.getAt(vertex));
        this.set('path', path);
        this.set('vertex', vertex);
        this.setMap(map);
        this.draw();
      };

      DeleteMenu.prototype.removeVertex = function() {
        var path = this.get('path');
        var vertex = this.get('vertex');

        if (!path || vertex == undefined) {
          this.close();

          return false;
        }

        path.removeAt(vertex);
        this.close();
      };

      var removeMenu = new DeleteMenu();

      google.maps.event.addListener(polygon, 'rightclick', function(e) {
        if (e.vertex == undefined) {
          return;
        }

        removeMenu.open(map, polygon.getPath(), e.vertex);
      });
    }

    function updateData(polygon) {
      var path = polygon.getPath();
      var points = [];

      $.each(path, function(index) {
        var point = path.getAt(index);
        var lat = point.lat();
        var lng = point.lng();

        points.push([lat, lng].join(','));
      });

      $data.val(points.join('\n'));
      showSavePublishButtons();
    }

    function normalisePoints(points) {
      return $.map(points, function(point) {
        var coords = point.split(',');
        var lat = parseFloat(coords[0]);
        var lng = parseFloat(coords[1]);

        return new google.maps.LatLng(lat, lng);
      });
    }

    function polygonBounds(polygon) {
      var bounds = new google.maps.LatLngBounds();
      var path = polygon.getPath();

      $.each(path, function(index) {
        bounds.extend(path.getAt(index));
      });

      return bounds;
    }

    function clearMap() {
      if (polygon) {
        polygon.setMap(null);
      }

      $data.val('');
      showDrawingManager();
      showSavePublishButtons();
    }

    function setBounds() {
      if (polygon === undefined && otherPolygons.length === 0) {
        return false;
      }

      var bounds = new google.maps.LatLngBounds();

      if (polygon) {
        bounds = polygonBounds(polygon);
      } else {
        $.each(otherPolygons, function(index, polygon) {
          var otherPolygonBounds = polygonBounds(polygon);
          bounds.union(otherPolygonBounds);
        });
      }

      map.setCenter(bounds.getCenter());
      map.fitBounds(bounds);
    }

    function showControls() {
      $controls.show();
    }

    function hideControls() {
      $controls.hide();
    }

    function showDrawingManager() {
      drawingManager.setMap(map);
    }

    function hideDrawingManager() {
      drawingManager.setMap(null);
    }

    function showSavePublishButtons() {
      $('.cms-edit-form').addClass('changed');
    }
  }

  // This will reload the map when the region is saved. Pulled from BetterBrief/silverstripe-googlemapfield
  if (!!$.fn.entwine && $(document.body).hasClass('cms')) {
    (function setupCMS() {
      var matchFunction = function() {
        if (gmapsAPILoaded) {
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
}(jQuery, window, document));
