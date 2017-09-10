/* global $ */
/* global L */
/* global Mustache */

//var baseUrl = "https://qgem.at";
var baseUrl = window.location.origin;
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
      templateStammdaten.schaechte = '<h4>Schacht</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Schachtart:</b> {{schachtart}}<br><b>Schachtzustand:</b> {{schachtzustand}}<br><b>Deckeloberkante [m]:</b> {{deckeloberkante}}<br><b>Sohlhöhe [m]:</b> {{sohlhoehe}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.haltungen = '<h4>Haltung</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Abwasserart:</b> {{abwasserart}}<br><b>Strang:</b> {{strang}}<br><b>Entwässerungssystem:</b> {{entwaesserungssystem}}<br><b>Haltungsmaterial:</b> {{haltungsmaterial}}<br><b>Länge [m]:</b> {{laenge}}<br><b>Gefälle [‰]:</b> {{gefaelle}}<br><b>DN/Breite [mm]:</b> {{breite}}<br><b>Anmerkung:</b> {{anmerkung}}';
      templateStammdaten.sonderbauwerke = '<h4>Sonderbauwerk</h4><b>Name:</b> {{name}}<br><b>Bezeichnung:</b> {{bezeichnung}}<br><b>Sonderbauwerkstyp:</b> {{sonderbauwerkstyp}}<br><b>Länge [m]:</b> {{laenge}}<br><b>Breite [m]:</b> {{breite}}<br><b>Höhe [m]:</b> {{hoehe}}<br><b>Anmerkung:</b> {{anmerkung}}';
      var coord = e.latlng;
      var feature =  e.feature;
      $.getJSON(baseUrl + "/kanal/" + feature.layer.name + "_tabelle?id=eq." + feature.properties.id, function (data) {
        if (data.length > 0) {
          var popup = L.popup({ closeOnClick : true }) 
          .setLatLng(coord)
          .setContent(Mustache.render(templateStammdaten[feature.layer.name] + 
          '<br><a href="#" class="popuplink btn btn-default btn-xs" data-name="' + feature.properties.name + '">Fotos und Videos</a>', data[0]))
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

function createModalFields(feature) {
  if ($("#fachschale").val() == 'kanal') {
    createModalFieldsKanal(feature.target);
  }
  if ($("#fachschale").val() == 'wasser') {
    createModalFieldsWasser(feature.target);
  }
}

function createModalFieldsKanal(e) {
    if (e.feature) {
      var feature =  e.feature;

      $.getJSON(baseUrl + "/kanal/wartungen?id=eq." + feature.properties.id + "&select=*,wartungsparameterwerte{*,wartungsparameter_id{*}}", function (data) {
        if (data.length > 0) {
          var wartung = data[0];
          wartung.checkWert = function () {
            if (typeof(this.wert) == "object")
              return true;
          }

          if (!(wartung).erfuellt_am)
            (wartung).erfuellt_am = moment().format('YYYY-MM-DD');

          $("#feature-title").html(feature.properties.wartungsart + " für " + feature.properties.objekttyp + " " + feature.properties.objektname);
          var template = '\
            <ul class="nav nav-tabs"> \
              <li class="active"><a data-toggle="tab" href="#sectionA">Allgemein</a></li> \
              <li><a data-toggle="tab" href="#sectionB">Beobachtungen</a></li> \
              <li><a data-toggle="tab" href="#sectionC">Folgetätigkeit</a></li> \
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
                <div class="row"> \
                <div class="form-group col-sm-4"> \
                  <label for="funktion">Funktion</label> \
                  <input type="number" class="form-control" id="funktion" min="1" max="5" required value="{{funktion}}"> \
                </div> \
                <div class="form-group col-sm-4"> \
                  <label for="gerinne">Gerinne</label> \
                  <input type="number" class="form-control" id="gerinne" min="1" max="5" required value="{{gerinne}}"> \
                </div> \
                <div class="form-group col-sm-4"> \
                  <label for="schacht">Schacht</label> \
                  <input type="number" class="form-control" id="schacht" min="1" max="5" required value="{{schacht}}"> \
                </div> \
                </div> \
                <div class="form-group"> \
                  <label for="wetter" ">Wetter</label> \
                  <select class="form-control" id="wetter"><option value="sonnig">sonnig</option><option value="bewölkt">bewölkt</option><option value="Niederschlag">Niederschlag</option></select> \
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
                <div class="form-group"> \
                  <label for="folgetaetigkeit">Folgetätigkeit</label> \
                  <select class="form-control" id="folgetaetigkeit"><option value="Inspektion">Inspektion</option><option value="Reinigung">Reinigung</option><option value="Sanierung">Sanierung</option>{{folgetaetigkeit}}</select> \
                </div> \
                <div class="form-group"> \
                  <label for="freie_eingabe">Freie Eingabe</label> \
                  <textarea class="form-control" id="freie_eingabe" rows="3">{{freie_eingabe}}</textarea> \
                </div> \
                <div class="form-group"> \
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
          
          $("#feature-info").find('option[value=' + wartung.status +']').attr('selected', true);
          $("#feature-info").find('option[value=' + wartung.wetter +']').attr('selected', true);
          $("#feature-info").find('option[value=' + wartung.folgetaetigkeit +']').attr('selected', true);
                  
          $("[name='my-checkbox']").bootstrapSwitch();
          $("#featureModal").modal("show");
          highlight.clearLayers().addLayer(L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], highlightStyle));

          $("#saveModal").click(function() {
            var wartung = {};
            $("#sectionA, #sectionC").find(":input").each(function() {
              if ($(this).prop.validity.valid) {
                wartung[$(this).prop("id")] = $(this).prop("value");
              }
            });
            $.ajax({
              url: baseUrl + '/kanal/wartungen?id=eq.' + feature.properties.id,
              method: 'PATCH',
              dataType: "xml/html/script/json", // expected format for response
              contentType: "application/json", // send as JSON
              data: JSON.stringify(wartung),
              success: function (data) {
                console.log(data);
                var marker = ['assets/img/marker-icon-blue.png', 'assets/img/marker-icon-green.png'];
                e.defaultOptions.icon.options.iconUrl = marker[wartung.status];
                e.setIcon(e.defaultOptions.icon);
              }
            });
            $("#sectionB").find(":input").each(function() {
              var parameterwert = {};
              var id = $(this).prop("id");
              parameterwert.wert = $(this).prop("checked");
              $.ajax({
                url: baseUrl + '/kanal/wartungsparameterwerte?id=eq.' + id,
                method: 'PATCH',
                dataType: "xml/html/script/json", // expected format for response
                contentType: "application/json", // send as JSON
                data: JSON.stringify(parameterwert),
                success: function (data) {
                  console.log(data);
                }
              });
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
          .setContent(Mustache.render(templateStammdaten[feature.layer.name] + 
          '<br><b>Fotos und Videos: </b><a href="#" class="popuplink" data-name="' + feature.properties.name + '">Öffnen</a>', data[0]))
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


function createModalFieldsWasser(feature) {
  return "<ul class='nav nav-tabs'>" + 
        "<li class='active'><a data-toggle='tab' href='#sectionA'>Allgemein</a></li>" +
        "<li><a data-toggle='tab' href='#sectionB'>Beobachtungen</a></li>" +
        "<li><a data-toggle='tab' href='#sectionC'>Beobachtungen</a></li>" +
    "</ul>" +
    "<div class='tab-content'>" +
        "<div id='sectionA' class='tab-pane fade in active'>" +
          "<table class='table table-striped table-bordered table-condensed'>" + 
          "<tr><th>Wartungsart</th><td>" + feature.properties.wartungsart + "</td></tr>" + 
          "<tr><th>Datum</th><td>" + feature.properties.datum + "</td></tr>" + 
          "<tr><th>Objekttyp</th><td>" + feature.properties.objekttyp + "</td></tr>" + 
          "<tr><th>Objektname</th><td>" + feature.properties.objektname + "</td></tr>" + 
          "<tr><th>Eingangstüre sperrbar</th><td>" + feature.properties.eingangstuere_sperrbar + "</td></tr>" + 
          "<tr><th>Eingangstüre korrodiert</th><td>" + feature.properties.eingangstuere_korrodiert + "</td></tr>" + 
          "<tr><th>Lüftungsschutz</th><td>" + feature.properties.lueftungsschutz + "</td></tr>" + 
          "<tr><th>Überdeckung</th><td>" + feature.properties.ueberdeckung + "</td></tr>" +
          "<tr><th>Bewuchs</th><td>" + feature.properties.bewuchs + "</td></tr>" +
          "<tr><th>Attika Geländer</th><td>" + feature.properties.attika_gelaender + "</td></tr>" +
          "<tr><th>Bauwerkszustand</th><td>" + feature.properties.bauwerk_zustand + "</td></tr>" +
         "</table>" +
        "</div>" +
        "<div id='sectionB' class='tab-pane fade'>" +
          "<table class='table table-striped table-bordered table-condensed'>" + 
          "<tr><th>Bauwerk Risse</th><td>" + feature.properties.bauwerk_risse + "</td></tr>" + 
          "<tr><th>Bauwerk Sinter</th><td>" + feature.properties.bauwerk_sinter + "</td></tr>" + 
          "<tr><th>Überlauf</th><td>" + feature.properties.ueberlauf + "</td></tr>" + 
          "<tr><th>Froschklappe</th><td>" + feature.properties.froschklappe + "</td></tr>" + 
          "<tr><th>Schieberkammer Zustand</th><td>" + feature.properties.schieberkammer_zustand + "</td></tr>" + 
          "<tr><th>Schieberkammer Risse</th><td>" + feature.properties.schieberkammer_risse + "</td></tr>" + 
          "<tr><th>Schieberkammer Sinter</th><td>" + feature.properties.schieberkammer_sinter + "</td></tr>" +
          "<tr><th>Schieberkammer Entlüftung</th><td>" + feature.properties.schieberkammer_entlueftung + "</td></tr>" +
          "<tr><th>Schieberkammer Insektenschutz</th><td>" + feature.properties.schieberkammer_insektenschutz + "</td></tr>" +
          "<tr><th>Armaturen gängig</th><td>" + feature.properties.armaturen_gaengig + "</td></tr>" +
          "<tr><th>Armaturen dicht</th><td>" + feature.properties.armaturen_dicht + "</td></tr>" +
         "</table>" +
        "</div>" +
        "<div id='sectionC' class='tab-pane fade'>" +
          "<table class='table table-striped table-bordered table-condensed'>" + 
          "<tr><th>Armaturen korrodiert</th><td>" + feature.properties.armaturen_korrodiert + "</td></tr>" + 
          "<tr><th>Rohre dicht</th><td>" + feature.properties.rohre_dicht + "</td></tr>" + 
          "<tr><th>Rohre korrodiert</th><td>" + feature.properties.rohre_korrodiert + "</td></tr>" + 
          "<tr><th>Einstiegsleiter Bügel</th><td>" + feature.properties.einstiegsleiter_buegel + "</td></tr>" + 
          "<tr><th>Wasserkammerzustand innen</th><td>" + feature.properties.wasserkammer_zustand_innen + "</td></tr>" + 
          "<tr><th>Wasserkammer Zustand Oberfläche</th><td>" + feature.properties.wasserkammer_zustand_oberflaeche + "</td></tr>" + 
          "<tr><th>Wasserkammer Risse</th><td>" + feature.properties.wasserkammer_risse + "</td></tr>" +
          "<tr><th>Wasserkammer Sinter</th><td>" + feature.properties.wasserkammer_sinter + "</td></tr>" +
          "<tr><th>Wasserkammer Entleuftung</th><td>" + feature.properties.wasserkammer_entleuftung + "</td></tr>" +
          "<tr><th>Wasserkammer Ablagerungen</th><td>" + feature.properties.wasserkammer_ablagerungen + "</td></tr>" +
          "<tr><th>Freier Text</th><td>" + feature.properties.freier_text + "</td></tr>" +
         "</table>" +
        "</div>" +
    "</div>";
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