/* global $ */
/* global L */
/* global Mustache */

var baseUrl = "https://qgem.at";
//var uploadServer = 'https://externalfiles-franzgusenbauer.c9users.io';
var uploadServer = 'https://qgem.at/uploadservice';

//var baseUrl = window.location.origin;
var vectoropts = {};
vectoropts.kanal = {
  url: baseUrl + "/vtiles/kanal/{z}/{x}/{y}.mvt",
  debug: false,
  maxZoom: 24,   
  clickableLayers: ['haltungen', 'schaechte', 'sonderbauwerke'],
  mutexToggle: true,
  getIDForLayerFeature: function(feature) {
    return feature.properties.id;
  },
  
  filter: function(feature, context) {
  if (feature.layer.name === 'schaechte' && feature.properties.art === 'Fiktiver Schacht') {
      return false;
    }
    return true;
  },
  
  
  onClick: function(e) {
    if (e.feature) {
      var templateStammdaten = {};
      templateStammdaten.schaechte = '<h4>Schacht</h4><b>Schacht Nr.:</b> {{schachtnummer}}<br><b>Strang:</b> {{strang}}<br><b>Entwässerungssystem:</b> {{entwaesserungssystem}}<br><b>Deckeloberkante [m]:</b> {{deckeloberkante}}<br><b>Sohlhöhe [m]:</b> {{sohlhoehe}}<br><b>Abstich [m]:</b> {{abstich}}<br><b>letzte Überprüfung:</b> {{ueberpfuefung}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Name:</b> {{name}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.haltungen = '<h4>Haltung</h4><b>Strang:</b> {{strang}}<br><b>Schacht:</b> {{schacht}}<br><b>Entwässerungssystem:</b> {{entwaesserungssystem}}<br><b>Haltungsmaterial:</b> {{haltungsmaterial}}<br><b>DN/Breite [mm]:</b> {{breite}}<br><b>Länge [m]:</b> {{laenge}}<br><b>Gefälle [‰]:</b> {{gefaelle}}<br><b>letzte Überprüfung:</b> {{ueberpfuefung}}<br><b>Abwasserart:</b> {{abwasserart}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Name:</b> {{name}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.sonderbauwerke = '<h4>Sonderbauwerk</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Sonderbauwerkstyp:</b> {{sonderbauwerkstyp}}<br><b>Länge [m]:</b> {{laenge}}<br><b>Breite [m]:</b> {{breite}}<br><b>Höhe [m]:</b> {{hoehe}}<br><b>Anmerkung:</b> {{anmerkung}}';
      var coord = e.latlng;
      var feature =  e.feature;
      $.getJSON(baseUrl + "/kanal/" + feature.layer.name + "_tabelle?id=eq." + feature.properties.id, function (data) {
        if (data.length > 0) {
          var popup = L.popup({ closeOnClick : true }) 
          .setLatLng(coord)
          .setContent(Mustache.render(templateStammdaten[feature.layer.name], data[0]) 
          + Mustache.render('<br><b>Wartung/Aufgabe:</b><br><select id="wartungsart_id">{{#.}}<option value="{{id}}">{{name}}</option>{{/.}}</select>', wartungsArten)
          + '<a href="#" class="popuplink btn btn-default btn-xs" data-value="' + feature.properties.id + '" data-key="' + feature.layer.name + '">Hinzufügen</a>')
          .openOn(feature.map);
        }
      }); 
    }
  },


  style: function(feature) {
    var style = {};
    var selected = style.selected = {};
    var layerName = feature.layer.name;
    switch (layerName) {
      case 'haltungen': //'LineString'
          // unselected
          style.color = function() {
            if (feature.properties.art === 'Schmutzwasser') {
              return 'rgba(102, 51, 10,0.9)';
            } else if (feature.properties.art === 'Regenwasser') {
              return 'rgba(0, 102, 204,0.9)';
            } else if (feature.properties.art === 'Mischwasser') {
              return 'rgba(51, 102, 0,0.9)';
            } else {
              return 'rgba(0, 0, 0,0.8)';
            }
          }();
        style.size = 3;
        // selected
        selected.color = 'rgba(255,25,0,0.5)';
        selected.size = 4;
        break;
      case 'schaechte': //'Point'
        // unselected
        style.color = '#ff0000';
        style.radius = 4;
        // selected
        selected.color = 'rgba(255,255,0,0.5)';
        selected.radius = 5;
        break;
      case 'sonderbauwerke': //'Point'
        // unselected
        style.color = '#1B0886';
        style.radius = 5;
        // selected
        selected.color = 'rgba(255,255,0,0.5)';
        selected.radius = 5;
        break;
    }

    if ((feature.layer.name === 'schaechte' && feature.properties.art === 'Hauptschacht') || feature.layer.name === 'sonderbauwerke') {
      style.staticLabel = function() {
      var style = {
        html: feature.properties.nummer,
        iconSize: [-15, 5],
        cssClass: 'label-icon-text'
      };
      return style;
    };
  }
    return style;
  }
}


function createModalFields(e) {
    var fachschale = $("#fachschale").val();
    if (e.target.feature) {
      var feature =  e.target.feature;
      $.getJSON(baseUrl + "/" + fachschale + "/wartungen?id=eq." + feature.properties.id + "&select=*,wartungsparameterwerte{*,wartungsparameter_id{*}}&wartungsparameterwerte.order=wartungsparameter_id.sortierung.asc", function (data) {
        if (data.length > 0) {
          var wartung = data[0];
          wartung.checkWert = function () {
            if (typeof(this.wert) == "object")
              return true;
          }

          if (!(wartung).erfuellt_am)
            (wartung).erfuellt_am = moment().format('YYYY-MM-DD');

          $("#feature-title").html(feature.properties.wartungsart + " für " + feature.properties.objektname);
          var template = '\
            <ul class="nav nav-pills"> \
              <li class="active"><a data-toggle="tab" href="#sectionA">Allgemein</a></li> \
              <li><a data-toggle="tab" href="#sectionB">Beobachtungen</a></li> \
              <li><a data-toggle="tab" href="#sectionC">Folgetätigkeiten</a></li> \
            </ul> \
            <div class="tab-content"> \
              <div id="sectionA" class="tab-pane fade in active"> \
                <div class="form-group"> \
                  <label for="datum">Datum</label> \
                  <input type="date" class="form-control" id="datum" value="{{datum}}"> \
                </div> \
                <div class="form-group"> \
                  <label for="status">Status</label> \
                  <select class="form-control" id="status"><option value="0">in Bearbeitung</option><option value="1">fertig</option>{{status}}</select> \
                </div> \
                <div id="funktion-gerinne-schacht" class="row"> \
                <div class="form-group col-xs-4"> \
                  <label for="funktion">Funktion</label> \
                  <input type="number" class="form-control" id="funktion" min="1" max="5" required value="{{funktion}}"> \
                </div> \
                <div class="form-group col-xs-4"> \
                  <label for="gerinne">Gerinne</label> \
                  <input type="number" class="form-control" id="gerinne" min="1" max="5" required value="{{gerinne}}"> \
                </div> \
                <div class="form-group col-xs-4"> \
                  <label for="schacht">Schacht</label> \
                  <input type="number" class="form-control" id="schacht" min="1" max="5" required value="{{schacht}}"> \
                </div> \
                </div> \
                <div class="form-group"> \
                  <label for="wetter" ">Wetter</label> \
                  <select class="form-control" id="wetter"><option value=""></option><option value="sonnig">sonnig</option><option value="bewölkt">bewölkt</option><option value="Niederschlag">Niederschlag</option></select> \
                </div> \
                <div class="form-group"> \
                  <label for="anmerkung" >Anmerkung</label> \
                  <textarea class="form-control" id="anmerkung" rows="3">{{anmerkung}}</textarea> \
                </div> \
              </div> \
              <div id="sectionB" class="tab-pane fade"> \
                {{#wartungsparameterwerte}}<p><input type="checkbox" id="{{id}}" data-indeterminate="{{checkWert}}" {{#wert}}checked{{/wert}} \
                  data-on-text="Ja" data-off-text="Nein" name="my-checkbox">  <label for="{{id}}">{{wartungsparameter_id.name}}</label></p>{{/wartungsparameterwerte}}</p> \
              </div> \
              <div id="sectionC" class="tab-pane fade"> \
                <form class="form">{{#wartungsparameterwerte}} \
                  <div class="form-group" id="folgetaetigkeit_{{id}}"> \
                    <label for="{{id}}" class="control-label" >{{wartungsparameter_id.name}}</label> \
                    <select class="form-control" data-selected="{{folgetaetigkeit}}" id="folgetaetigkeit_select_{{id}}"><option value="-"></option><option value="Inspektion">Inspektion</option><option value="Reinigung">Reinigung</option><option value="Sanierung">Sanierung</option>{{folgetaetigkeit}}</select> \
                  </div> \
                {{/wartungsparameterwerte}} </form> \
                <div class="form-group"> <br><hr>\
                  <label for="erfuellt_am">Erfüllt am</label> \
                  <input type="date" class="form-control" id="erfuellt_am" value="{{erfuellt_am}}"> \
                </div> \
                <div class="form-group"> \
                  <label for="erfuellt_von">Erfüllt von</label> \
                  <input type="text" class="form-control" id="erfuellt_von" value="{{erfuellt_von}}"> \
                </div> \
              </div> \
            </div>';
    

          $("#feature-info").html(Mustache.render(template, wartung));
          // Selected Option
          $('[data-selected]').find("option").filter(function() {
            return $(this).text() == $(this).parent().data('selected');  
          }).attr('selected',true);
          
          // Folgetätigkeiten
          $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var target = $(e.target).attr("href") // activated tab
            if (target === '#sectionC') {
              $("#sectionB").find(":input").each(function() {
                if ($(this).prop("checked") === true || $(this).prop("indeterminate") === true) {
                  $("#folgetaetigkeit_" + this.id).hide(); 
                } else {
                  $("#folgetaetigkeit_" + this.id).show(); 
                }
              }); 
            }
          });
          
          // Schacht Gerinne bei Wasser verbergen
          if (fachschale === 'wasser') {
            $("#funktion-gerinne-schacht").hide();
          } 
          
          
          $("#feature-info").find("option[value='" + wartung.status +"']").attr('selected', true);
          $("#feature-info").find("option[value='" + wartung.wetter +"']").attr('selected', true);

          $("[name='my-checkbox']").bootstrapSwitch();
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));


          $("#openCamera").off('click').on('click', function() {});
          $("#openCamera").on('click', function() {
              cameraModule.accessCamera(fachschale, feature.properties.id, feature.properties.objektname.substring(0, 12))
          });
   
          
          $("#openGallery").off('click').on('click', function() {});
          $("#openGallery").click(function() {
            openGallery(fachschale, 'wartung_id', feature.properties.id);
          });
    
          
          $("#saveModal").off('click').on('click', function() {});
          $("#saveModal").click(function() {
            var wartung = {};
            $("#sectionA").find(":input").each(function() {
              if ((this).validity.valid) {
                wartung[$(this).prop("id")] = $(this).prop("value");
              }
            });
            wartung.erfuellt_am = $('#erfuellt_am').prop("value");
            wartung.erfuellt_von = $('#erfuellt_von').prop("value");
            $.ajax({
              url: baseUrl + '/' + fachschale + '/wartungen?id=eq.' + feature.properties.id,
              method: 'PATCH',
              dataType: "xml/html/script/json", // expected format for response
              contentType: "application/json", // send as JSON
              data: JSON.stringify(wartung),
              success: function (data) {
                $("#sectionB").find(":input").each(function() {
                  if (this.indeterminate == false) {
                    var parameterwert = {};
                    var id = $(this).prop("id");
                    parameterwert.wert = $(this).prop("checked");
                    $("folgetaetigkeit_select_" + id).prop("value");
                    parameterwert.folgetaetigkeit = "";
                    if (parameterwert.wert === false) {
                      parameterwert.folgetaetigkeit = $("#folgetaetigkeit_select_" + id).val();                    
                    }
  
                    $.ajax({
                      url: baseUrl + '/' + fachschale + '/wartungsparameterwerte?id=eq.' + id,
                      method: 'PATCH',
                      dataType: "xml/html/script/json", // expected format for response
                      contentType: "application/json", // send as JSON
                      data: JSON.stringify(parameterwert),
                      success: function (data) {
                        console.log(data);
                      }
                    });
                  }
                });
                var marker = ['assets/img/marker-icon-blue.png', 'assets/img/marker-icon-green.png'];
                e.target.defaultOptions.icon.options.iconUrl =  function () {
                  if(wartung.status == 0 && feature.properties.typ == 'Wartung') 
                    return 'assets/img/marker-icon-blue.png'
                  if(wartung.status == 1 && feature.properties.typ == 'Wartung')
                    return 'assets/img/marker-icon-green.png'
                  if(wartung.status == 0 && feature.properties.typ == 'Aufgabe') 
                    return 'assets/img/marker-icon-blue2.png'
                  if(wartung.status == 1 && feature.properties.typ == 'Aufgabe') 
                    return 'assets/img/marker-icon-green2.png'
                }();
                e.target.setIcon(e.target.defaultOptions.icon);
              }
            });
          })
        }
      }); 
    }
}


vectoropts.wasser = {
  url: baseUrl + "/vtiles/wasser/{z}/{x}/{y}.mvt",
  debug: false,
  maxZoom: 24,  
  mutexToggle: true,
  clickableLayers: ['einbauten', 'sonstigeanlagen', 'wasseraufbereitungsanlagen', 'wasserspeicherbauwerke', 'leitungen'],
  getIDForLayerFeature: function(feature) {
    return feature.properties.id;
  },

  onClick: function(e) {
    if (e.feature) {
      var templateStammdaten = {};
      templateStammdaten.leitungen = '<h4>Leitung</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Leitungsart:</b> {{leitungsart}}<br><b>Leitungsmaterial:</b> {{leitungsmaterial}}<br><b>Durchmesser [mm]:</b> {{durchmesser}}<br><b>Druckstufe:</b> {{druckstufe}}<br><b>Länge [m]:</b> {{laenge}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.einbauten = '<h4>Einbauteil</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Einbauart:</b> {{einbauart}}<br><b>Fabrikat:</b> {{fabrikat}}<br><b>Geländeoberkante [m]:</b> {{gelaendeoberkante}}<br><b>Höhe [m]:</b> {{hoehe}}<br><b>Abstich [m]:</b> {{abstich}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.sonstigeanlagen = '<h4>Sonstige Anlage</h4><b>Name</b>: {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Anlagenart:</b>: {{sonstigeanlagenart}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.wasseraufbereitungsanlagen = '<h4>Wasseraufbereitungsanlage</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Filtrationsart:</b> {{filtrationsart}}<br><b>Chlorierung:</b> {{chlorierung}}<br><b>UV-Desinfektion:</b> {{uv_desinfektion}}<br><b>Ozon Desinfektion:</b> {{ozon_desinfektion}}<br><b>Entsäuerung:</b> {{entsaeuerung}}<br><b>Enteisung:</b> {{enteisung}}<br><b>Entmanganung:</b> {{entmanganung}}<br><b>Aktivkohle:</b> {{aktivkohle}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.wasserspeicherbauwerke = '<h4>Wasserspeicherbauwerk</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Wasserspeicherbauwerksart:</b> {{wasserspeicherbauwerksart}}<br><b>Pumpwerk:</b> {{pumpwerk}}<br><b>Aufbereitung:</b> {{aufbereitung}}<br><b>Nutzinhalt:</b> {{nutzinhalt}}<br><b>Wasserkammer:</b> {{wasserkammer}}<br><b>Anmerkung:</b> {{anmerkung}}';
      var coord = e.latlng;
      var feature =  e.feature;
      $.getJSON(baseUrl + "/wasser/" + feature.layer.name + "_tabelle?id=eq." + feature.properties.id, function (data) {
        if (data.length > 0) {
          var popup = L.popup({ closeOnClick : true }) 
          .setLatLng(coord)
          .setContent(Mustache.render(templateStammdaten[feature.layer.name], data[0]) 
          + Mustache.render('<br><b>Wartung/Aufgabe:</b><br><select id="wartungsart_id">{{#.}}<option value="{{id}}">{{name}}</option>{{/.}}</select>', wartungsArten)
          + '<a href="#" class="popuplink btn btn-default btn-xs" data-value="' + feature.properties.id + '" data-key="' + feature.layer.name + '">Hinzufügen</a>')
          .openOn(feature.map);
        }
      }); 
    }
  },
  
  style: function(feature) {
    var style = {};
    var selected = style.selected = {};

    var layerName = feature.layer.name;
    switch (layerName) {
      case 'leitungen': //'LineString'
        // unselected
        style.color = 'rgba(20, 81, 142,0.8)';
        style.size = 3;
        // selected
        selected.color = 'rgba(255,25,0,0.5)';
        selected.size = 4;
        break;
      case 'einbauten': //'Point'
        // unselected
        style.color = '#ff0000';
        style.radius = 4;
        // selected
        selected.color = 'rgba(255,255,0,0.5)';
        selected.radius = 5;
        break;
      case 'sonstigeanlagen': //'Point'
        // unselected
        style.color = '#ff6600';
        style.radius = 5;
        // selected
        selected.color = 'rgba(255,255,0,0.5)';
        selected.radius = 6;
        break;
      case 'wasseraufbereitungsanlagen': //'Point'
        // unselected
        style.color = '#cc6600';
        style.radius = 5;
        // selected
        selected.color = 'rgba(255,255,0,0.5)';
        selected.radius = 6;
        break;
      case 'wasserspeicherbauwerke': //'Point'
        // unselected
        style.color = '#009900';
        style.radius = 5;
        // selected
        selected.color = 'rgba(255,255,0,0.5)';
        selected.radius = 6;
        break;
    }

    if (feature.layer.name === 'einbauten' || feature.layer.name === 'sonstigeanlagen' || feature.layer.name === 'wasseraufbereitungsanlagen' || feature.layer.name === 'wasserspeicherbauwerke') {
      style.staticLabel = function() {
      var style = {
        html: feature.properties.nummer,
        iconSize: [-15, 5],
        cssClass: 'label-icon-text'
      };
      return style;
    };
  }
    return style;
  }
}


function getQueryVariable(variable)
{
       var query = window.location.search.substring(1);
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}
//test