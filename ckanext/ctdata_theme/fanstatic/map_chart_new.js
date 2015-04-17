// var chart;


function swap(array,i,j){
  temp = array[i]
  array[i] = array[j]
  array[j] = temp
}

function getColor(d) {
  return d > 1000 ? 'rgb(239,239,255)' :
         d > 500  ? 'rgb(171,187,216)' :
         d > 200  ? 'rgb(137,161,196)' :
         d > 100  ? 'rgb(102,134,176)' :
         d > 50   ? 'rgb(68, 108,156)' :
         d > 20   ? 'rgb(34, 82, 137)' :
         d > 10   ? 'rgb(0,  56, 117)' :
                    'rgb(1,  35, 73)'  ;
}

function style(feature) {
    return {
        fillColor: getColor(feature.properties['Value']),
        weight: 1,
        opacity: 1,
        color: '#C4C4C4',
        dashArray: '3',
        fillOpacity: 0.8
    };
}

/********************************** MAIN *****************************/

function draw_map(){
  var dataset_id = $("#dataset_id").val(),
      dataset_title = $("dataset_title").val();

  filters = get_filters();
  var town_index = -1;        //Remove town filter, since for a map we want all of them

  $.each(filters, function(i){
    if(filters[i]['field'] == geography_param)
      town_index = i
  });

  if (town_index >= 0)
    filters.splice(town_index, 1)

  $("#container_2").addClass('hidden');
  $("#link_to_second_table").addClass('hidden');
  $("#container_2").html('');
  $("#container").html('');

  $.ajax({type: "POST",
    url:         "/vizualization_data/" + dataset_id,
    data:        JSON.stringify({view: 'map', filters: filters }),
    contentType: 'application/json; charset=utf-8'}).done(function(data){
      change_page_url(data['link']);

      if (data.data.length == 0){
        hide_spinner();
        return display_error('Map view is not available');
      }

      handle_incompatibilities(data['compatibles']);
      $("#container").html('<div id="map"></div>');
      // var map = L.map('map').setView([51.505, -0.09], 13);
      var map = L.map('map').setView([41.571, -72.68], 9);

      L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          'Imagery © <a href="http://mapbox.com">Mapbox</a>',
        id: 'examples.map-20v6611k'
      }).addTo(map);

      L.Icon.Default.imagePath = '/common/images'


      var max = -Infinity;
      var min = 0;
      var asterisks_counter = 0;
      var geo_ids    = []
      var geo_names  = {}
      var value_counters = {}

      $.getJSON('/common/map.json', function (geojson) {
        new_geojson = geojson
        if (geography_param != 'Town'){
            $.each(geojson['features'], function(i){
              id   = geojson['features'][i]['properties']['GEOID']
              name = geojson['features'][i]['properties']['NAME']
              geo_ids.push(id)
              geo_names[id] = name
              value_counters[id] = 0
             });
          } else{
            $.each(geojson['features'], function(i){
              name = geojson['features'][i]['properties']['NAME']
              value_counters[name] = 0
            });
          }

        $.each(data.data, function(i){

          if (geography_param != 'Town'){
            if (geo_ids.indexOf(data.data[i]['fips']) > -1){
              geo_ids.splice(geo_ids.indexOf(data.data[i]['fips']), 1)
            }
          }

          if (geography_param != 'Town')
            id = data.data[i]['fips']
          else
            id = data.data[i]['code']

          if (value_counters[id] != undefined){
            value_counters[id] += 1
          }

          if (data.data[i]['code'] == "Connecticut"){
            delete data.data[i];
            return "Skip data for all of connecticut"
          }
          if (data.data[i]['value'] == SUPPRESSED_VALUE){
            if (geography_param != 'Town'){

              if (data.data[i]['fips'] != '0None'){
                data.data[i]['value'] = '*'
                asterisks_counter++;
              }
            }
            return "Skip supressed data"
          }
          if(data.data[i]['value'] > max && data.data[i]['fips'] != '0None')
            max = data.data[i]['value'];
          if(data.data[i]['value'] < min && data.data[i]['fips'] != '0None')
            min = data.data[i]['value'];

          if (geography_param != 'Town'){
            $.each(new_geojson.features, function(j){
              if (new_geojson.features[j].properties['NAME'] == data.data[i]['code'])
                new_geojson.features[j].properties['Value'] = data.data[i]['value']
            })
          }
          else{
            $.each(new_geojson.features, function(j){
              if (data.data[i] && new_geojson.features[j].properties['NAME'] == data.data[i]['code']){
                new_geojson.features[j].properties['Value'] = data.data[i]['value']

              }
            })

          }

        });

        if (geography_param != 'Town'){
          $.each(geo_ids, function(i){
            data.data.push({code: geo_names[geo_ids[i]], fips: geo_ids[i], value: -8888})
          });
        }

        var info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        info.update = function (props) {
            this._div.innerHTML = '<h4></h4>' +  (props ?
                '<b>' + props['NAME'] + '</b><br />' + props['Value'] + ''
                : 'Hover over a сity');
        };

        info.addTo(map);

        var geojs;

        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 5,
                color: 'rgba(21, 107, 16, 0.75)',
                dashArray: '',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera) {
                layer.bringToFront();
            }
            info.update(e.target.feature.properties);
        }

        function resetHighlight(e) {
          geojs.resetStyle(e.target);
          info.update();
        }

        function onEachFeature(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
            });
        }

        var legend = L.control({position: 'bottomright'});
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [0, 10, 20, 50, 100, 200, 500, 1000],
                labels = [];
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }
            return div;
        };

        legend.addTo(map);

        geojs = L.geoJson(new_geojson, {style: style, onEachFeature: onEachFeature}).addTo(map);
        hide_spinner();

      })





  });



}


