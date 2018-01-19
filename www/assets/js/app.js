/* global $ */
/* global L */
/* global localStorage */
/* global vectoropts */
/* global baseUrl */



var map, featureList, wartungenSearch = [];


$(document).ready(function() {
  $.fn.bootstrapSwitch.defaults.size = 'normal';
  $.fn.bootstrapSwitch.defaults.onColor = 'success';
  $.fn.bootstrapSwitch.defaults.offColor = 'danger';
	if (loadFromLocalStorage() == true) {
    loadFromQuerystring();
    login();
	} else {
    $("#loginModal").modal("show");
    $(".navbar-collapse.in").collapse("hide");
    $("#fachschale").val('kanal');
    loadFromQuerystring();
  };
});

function loadFromLocalStorage() {
  if (localStorage.qgemSettings) {
    var qgemSettings = JSON.parse(localStorage.qgemSettings);
    $("#projektnummer").val(qgemSettings.projektnummer);
    $("#fachschale").val(qgemSettings.fachschale.toLowerCase());
    $("#benutzername").val(qgemSettings.benutzername);
    $("#kennwort").val(qgemSettings.kennwort);    
    return true;
  }
}

function loadFromQuerystring() {
  if (!document.location.search) {
    return;
  }
  var queries = {}; $.each(document.location.search.substr(1).split('&'),function(c,q){ var i = q.split('='); queries[i[0].toString()] = i[1].toString(); });
  if (queries.projektnummer) {
    $("#projektnummer").val(queries.projektnummer);
  };
  if (queries.fachschale) {
    $("#fachschale").val(queries.fachschale.toLowerCase());
  };
  if (queries.benutzername) {
    $("#benutzername").val(queries.benutzername);
  };
  if (queries.kennwort) {
    $("#kennwort").val(queries.kennwort);
  };
}

// Loginfenster anpassen
$('#loginModal').on('shown.bs.modal', function () {
  $('#projektnummer').focus();
  $('#projektnummer').select();
  $('#kennwort, #benutzername, #projektnummer').keypress(function(e) {
    if(e.keyCode === 13){
        $('#loginStart').trigger('click');
    };
});
})

// Event für Loginbutton
$(document).on("click", "#loginStart", login);

// Login Funktion
function login (e) {
  $("#projektnummer").val(numberPadding($("#projektnummer").val(), 3));
  $.post(baseUrl + "/login/jwt", 
    {
      projektnummer: $("#projektnummer").val(),
      fachschale: $("#fachschale").val(),
      benutzername: $("#benutzername").val(),
      kennwort: $("#kennwort").val()
    }, 
    function (data, status) {
      if (data.result === true){
        $("#loading").css("visibility", "visible");
        // Store Settings in local storage 
        var qgemSettings =  {
          projektnummer: $("#projektnummer").val(),
          fachschale: $("#fachschale").val(),
          benutzername: $("#benutzername").val(),
          kennwort: $("#kennwort").val()
        }
        window.localStorage.setItem('qgemSettings', JSON.stringify(qgemSettings));
        // Save Token und Role in Window Object
        window.qgemToken = data.token;

        // Load Projekt
        $.getJSON(baseUrl + "/" + qgemSettings.fachschale + "/projekte", function (data) {
          if (data.length > 0) {
            map.fitBounds([[data[0].y_min, data[0].x_min], [data[0].y_max, data[0].x_max]]);
            window.projektGrenzen = map.getBounds();
            $("#ueberschrift").html(data[0].name);
            document.title = 'Spider - ' + data[0].name;
          }
        });    
        
        // Vector Tiles
        var qgemRole = $("#projektnummer").val() + '_' + $("#fachschale").val() + '_manager';
        
        // Gemeindenummer zur Rolle hinzufügen
        if (parseInt($("#benutzername").val().slice(-5)))
            qgemRole += '_' +  $("#benutzername").val().slice(-5);
                
        layerControl.removeLayer(mvtSource);
        map.removeLayer(mvtSource);
        mvtSource = new L.TileLayer.MVTSource(vectoropts[qgemSettings.fachschale]);
        mvtSource._url = mvtSource.options.url + "?role=" + qgemRole;
        //mvtSource.options.xhrHeaders.Authorization = "Bearer " + window.qgemToken;
        map.addLayer(mvtSource);
        layerControl.addOverlay(mvtSource, "Netz", "Kanalnetz");

        //Load Wartungen
        $.getJSON(baseUrl + "/" + qgemSettings.fachschale + "/wartungen_geojson", function (data) {
          markerClusters.removeLayer(wartungen);
          wartungen.clearLayers();
          if (data[0].geojson.features) {
            //data[0].geojson.features = data[0].geojson.features.filter(function(feature) {
            //  return feature.properties.typ === 'Wartung';
            //})
            wartungen.addData(data[0].geojson);
            markerClusters.addLayer(wartungen);
            if (!map.hasLayer(wartungenLayer)) {
              map.addLayer(wartungenLayer);   
            };
            syncSidebar();
          };
        }); 
      } else {
        alert("Anmeldung fehlgeschlagen!");
      }; 
    });
  }

document.getElementById('map').style.cursor = 'pointer'

// always send JWT Token
$(document).ajaxSend(function(event, request) {
    request.setRequestHeader("Authorization", "Bearer " + window.qgemToken);
});

$(window).resize(function() {
  sizeLayerControl();
});

$(document).keydown(function(e){
  if (e.altKey && e.keyCode == 65) {
    $('#login-btn').trigger('click');;
  }
});
    
$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
});

if ( !("ontouchstart" in window) ) {
  $(document).on("mouseover", ".feature-row", function(e) {
    highlight.clearLayers().addLayer(L.circleMarker([$(this).attr("lat"), $(this).attr("lng")], highlightStyle));
  });
}

$(document).on("mouseout", ".feature-row", clearHighlight);

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(window.projektGrenzen);
  map.fitBounds(wartungen.getBounds());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#legend-btn").click(function() {
  $("#legendModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#login-btn").click(function() {
  $("#loginModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#list-btn").click(function() {
  $('#sidebar').toggle();
  map.invalidateSize();
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

$("#sidebar-toggle-btn").click(function() {
  $("#sidebar").toggle();
  map.invalidateSize();
  return false;
});

$("#sidebar-hide-btn").click(function() {
  $('#sidebar').hide();
  map.invalidateSize();
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 50);
}

function clearHighlight() {
  highlight.clearLayers();
}

function sidebarClick(id) {
  var layer = markerClusters.getLayer(id);
  map.setView([layer.getLatLng().lat, layer.getLatLng().lng], 17);
  layer.fire("click");
  /* Hide sidebar and go to the map on small screens */
  if (document.body.clientWidth <= 767) {
    $("#sidebar").hide();
    map.invalidateSize();
  }
}

function syncSidebar() {
  /* Empty sidebar features */
  $("#feature-list tbody").empty();
  /* Loop through wartungen layer and add only features which are in the map bounds */
  wartungen.eachLayer(function (layer) {
    if (map.hasLayer(wartungenLayer)) {
      if (map.getBounds().contains(layer.getLatLng())) {
        $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="26" src="' + layer.options.icon.options.iconUrl + '"></td><td class="feature-name">' + layer.feature.properties.objektname + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      }
    }
  });

  /* Update list.js featureList */
  featureList = new List("features", {
    valueNames: ["feature-name"]
  });
  featureList.sort("feature-name", {
    order: "asc"
  });
}

/* Basemap Layers */
var openStreetMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 24,
  maxNativeZoom: 19,
  attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
});
var mapBaseMapOrthofoto =  L.tileLayer("https://maps{s}.wien.gv.at/basemap/bmaporthofoto30cm/normal/google3857/{z}/{y}/{x}.jpeg", {
  maxZoom: 24,
  maxNativeZoom: 19,
  subdomains: ['', '1', '2', '3', '4'],
  attribution: 'Datenquelle <a href="https://www.basemap.at" target="_blank">basemap.at</a> - Offizielle Verwaltungsgrundkarte von Österreich'
});
var mapBaseMap = L.tileLayer("https://maps{s}.wien.gv.at/basemap/geolandbasemap/normal/google3857/{z}/{y}/{x}.png", {
  maxZoom: 24,
  maxNativeZoom: 19,
  subdomains: ['', '1', '2', '3', '4'],
  attribution: 'Datenquelle <a href="https://www.basemap.at" target="_blank">basemap.at</a> - Offizielle Verwaltungsgrundkarte von Österreich'
});
//var mapEsriImage = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
//  maxZoom: 24,
//  maxNativeZoom: 18,
//  attribution: 'Datenquelle: <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community;'
//});	

var grundstuecke = L.tileLayer.wms('https://wsa.bev.gv.at/GeoServer/Interceptor/Wms/CP/INSPIRE_KUNDEN-03a602b7-8a1b-472c-9fc3-f56b3b3c34b1', {
	minZoom: 17,
	maxZoom: 24,
	layers: '3',
	format: 'image/png',
	transparent: true,
	attribution: "BEV Grundstücksgrenzen"
})

var gemeinden = L.tileLayer.wms('https://wsa.bev.gv.at/GeoServer/Interceptor/Wms/AU/INSPIRE_KUNDEN-03a602b7-8a1b-472c-9fc3-f56b3b3c34b1', {
	maxZoom: 20,
	layers: '2',
	format: 'image/png',
	transparent: true,
	attribution: "BEV Gemeindegrenzen"
})

/* Overlay Layers */
var highlight = L.geoJson(null);
var highlightStyle = {
  stroke: false,
  fillColor: "#f70",
  fillOpacity: 0.8,
  radius: 8
};


/* Single marker cluster layer to hold all clusters */
var markerClusters = new L.MarkerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: true,
  disableClusteringAtZoom: 16
});

    
/* Empty layer placeholder to add to layer control for listening when to add/remove wartungen to markerClusters layer */
var wartungenLayer = L.geoJson(null);
var wartungen = L.geoJson(null, {
  pointToLayer: function (feature, latlng) {
    return L.marker(latlng, {
      icon: L.icon({
        iconUrl: function () {
          if(feature.properties.status === 0 && feature.properties.typ === 'Wartung') 
            return 'assets/img/marker-icon-blue.png'
          if(feature.properties.status === 1 && feature.properties.typ === 'Wartung')
            return 'assets/img/marker-icon-green.png'
          if(feature.properties.status === 0 && feature.properties.typ === 'Aufgabe') 
            return 'assets/img/marker-icon-blue2.png'
          if(feature.properties.status === 1 && feature.properties.typ === 'Aufgabe') 
            return 'assets/img/marker-icon-green2.png'
        }() ,
        iconSize: [25, 41],
        iconAnchor: [11, 41],
        shadowUrl: 'assets/img/wartungen-shadow.png',
        shadowSize: [50, 64],
        shadowAnchor: [11, 64],
        popupAnchor: [0, 0]
      }),
      title: feature.properties.objektname,
      riseOnHover: true
    });
  },
  onEachFeature: function (feature, layer) {
    if (feature.properties) {
      layer.on({
        click: createModalFields
      });
      
      $("#feature-list tbody").append('<tr class="feature-row" id="' + L.stamp(layer) + '" lat="' + layer.getLatLng().lat + '" lng="' + layer.getLatLng().lng + '"><td style="vertical-align: middle;"><img width="16" height="26" src="assets/img/wartungen.png"></td><td class="feature-name">' + layer.feature.properties.objektname + '</td><td style="vertical-align: middle;"><i class="fa fa-chevron-right pull-right"></i></td></tr>');
      wartungenSearch.push({
        name: layer.feature.properties.objektname,
        address: layer.feature.properties.ADDRESS1,
        source: "Wartungen",
        id: L.stamp(layer),
        lat: layer.feature.geometry.coordinates[1],
        lng: layer.feature.geometry.coordinates[0]
      });
    }
  }
});


//Vector Tiles
var mvtSource = new L.TileLayer.MVTSource(vectoropts['kanal']);

map = L.map("map", {
  zoom: 13,
  center: [47.6255,13.3903],
  layers: [mapBaseMap, mvtSource, markerClusters, highlight],
  zoomControl: false,
  tap: false,
  attributionControl: false
});

map.on('popupopen', function() {
    $('.popuplink').click(function() {
      var transfer = {};
      transfer.value = $(".popuplink").attr('data-value'); 
      transfer.key = $(".popuplink").attr('data-key'); 
      transfer.wartungsart_id = $(".popuplink").attr('data-wartungsart_id'); 
      $.ajax({
        url: baseUrl + '/' + 'kanal' + '/rpc/create_aufgabe',
        method: 'POST',
        contentType: "application/json", // send as JSON
        data: JSON.stringify(transfer),
        success: function (data) {
          if (data.features) {
            wartungen.addData(data);
            markerClusters.addLayer(wartungen);
            if (!map.hasLayer(wartungenLayer)) {
              map.addLayer(wartungenLayer);   
            };
            syncSidebar();
          };
        },
        error: function (error) {
          console.log('Fehler beim Hinzufügen einer Aufgabe');
        }
      });
    });
});

function openGallery(fachschale, key, value) {
  var url = uploadServer + '/list?schema=' + fachschale + '&key=' + key + '&value=' + value;
  $.getJSON(url, function (images){
    var galleryHtml = "";
    for (var i = 0; i < images.length; i++) {
      galleryHtml += '<img alt="" src="https://placeholdit.imgix.net/~text?txtsize=35&txt=Spider&w=150&h=100" data-image="' + uploadServer + '/download?dateiname=' + images[i].dateiname + '" data-description="">';
    }
    $("#gallery").html(galleryHtml);
		$('#imagemodal').modal('show');
		var apigallery = $("#gallery").unitegallery({gallery_width:"100%",gallery_height:"100%"}); 
		$('#fullscreen-gallery').click(function() {
		  apigallery.enterFullscreen();
		});
  });
}

/* Layer control listeners that allow for a single markerClusters layer */
map.on("overlayadd", function(e) {
  if (e.layer === wartungenLayer) {
    markerClusters.addLayer(wartungen);
    syncSidebar();
  }
});

map.on("overlayremove", function(e) {
  if (e.layer === wartungenLayer) {
    markerClusters.removeLayer(wartungen);
    syncSidebar();
  }
});

/* Filter sidebar feature list to only show features in current map bounds */
map.on("moveend", function (e) {
  syncSidebar();
});

/* Clear feature highlight when map is clicked */
map.on("click", function(e) {
  highlight.clearLayers();
});

/* Attribution control */
function updateAttribution(e) {
  var attributionText = '';
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      attributionText += layer.getAttribution();
    }
  });
  $("#attribution").html(attributionText);
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Based on <a href='https://github.com/bmcbride/bootleaf'>Bootleaf</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "bottomright"
}).addTo(map);

/* GPS enabled geolocation control set to follow the user's location */
var locateControl = L.control.locate({
  position: "bottomright",
  drawCircle: true,
  follow: true,
  setView: true,
  keepCurrentZoomLevel: true,
  markerStyle: {
    weight: 1,
    opacity: 0.8,
    fillOpacity: 0.8
  },
  circleStyle: {
    weight: 1,
    clickable: false
  },
  icon: "fa fa-location-arrow",
  metric: false,
  strings: {
    title: "Meine Position",
    popup: "You are within {distance} {unit} from this point",
    outsideMapBoundsMsg: "You seem located outside the boundaries of the map"
  },
  locateOptions: {
    maxZoom: 18,
    watch: true,
    enableHighAccuracy: true,
    maximumAge: 10000,
    timeout: 10000
  }
}).addTo(map);

/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}


var baseLayers = {
    "Basemap Standard": mapBaseMap,
    "Basemap Orthophoto": mapBaseMapOrthofoto,
    "OpenStreetMap": openStreetMap
};

var groupedOverlays = {
  "Wartungen": {
    "<img src='assets/img/wartungen.png' width='16' height='26'>&nbsp;Wartung": wartungenLayer
  },
  "Kanalnetz": {
    "Netz": mvtSource
  },
  "Verwaltung": {
    "Gemeinden": gemeinden,
    "Grundstuecke": grundstuecke
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  collapsed: isCollapsed
}).addTo(map);

// Änderung 2016-03-01: MVT Layer soll immer über Baselayer liegen
map.on('layeradd', function(e) {
    mvtSource.setZIndex(10);
});  

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();
  /* Fit map to trasse bounds */
  map.fitBounds(wartungen.getBounds());
  featureList = new List("features", {valueNames: ["feature-name"]});
  featureList.sort("feature-name", {order:"asc"});

  var wartungenBH = new Bloodhound({
    name: "Wartungen",
    datumTokenizer: function (d) {
      return Bloodhound.tokenizers.whitespace(d.name);
    },
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    local: wartungenSearch,
    limit: 10
  });

  wartungenBH.initialize();
    
 

  /* instantiate the typeahead UI */
  $("#searchbox").typeahead({
    minLength: 3,
    highlight: true,
    hint: false
  }, {
    name: "Wartungen",
    displayKey: "name",
    source: wartungenBH.ttAdapter(),
    templates: {
      header: "<h4 class='typeahead-header'><img src='assets/img/wartungen.png' width='16' height='26'>&nbsp;Wartungen</h4>",
      suggestion: Handlebars.compile(["{{name}}<br>&nbsp;<small>{{address}}</small>"].join(""))
    }
  }).on("typeahead:selected", function (obj, datum) {
    if (datum.source === "Wartungen") {
      map.fitBounds(datum.bounds);
    }
    if (datum.source === "Wartungen") {
      if (!map.hasLayer(wartungenLayer)) {
        map.addLayer(wartungenLayer);
      }
      map.setView([datum.lat, datum.lng], 17);
      if (map._layers[datum.id]) {
        map._layers[datum.id].fire("click");
      }
    }
    
    if ($(".navbar-collapse").height() > 50) {
      $(".navbar-collapse").collapse("hide");
    }
  }).on("typeahead:opened", function () {
    $(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
    $(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
  }).on("typeahead:closed", function () {
    $(".navbar-collapse.in").css("max-height", "");
    $(".navbar-collapse.in").css("height", "");
  });
  $(".twitter-typeahead").css("position", "static");
  $(".twitter-typeahead").css("display", "block");
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}

function numberPadding(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

