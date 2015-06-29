var legend_items = [0, 10, 20, 50, 100, 200, 500, 1000, 2000];

function getColor(d) {
  return d >=  legend_items[7] ?  'rgb(1,  35, 73)'  :
         d >=  legend_items[6] ?  'rgb(0,  56, 117)' :
         d >=  legend_items[5] ?  'rgb(34, 82, 137)' :
         d >=  legend_items[4] ?  'rgb(68,108,156)' :
         d >=  legend_items[3] ?  'rgb(102,134,176)' :
         d >=  legend_items[2] ?  'rgb(137,161,196)' :
         d >=  legend_items[1] ?  'rgb(171,187,216)' :
         d >=  legend_items[0] - 1 ?  'rgb(239,239,255)' :

         d > -10000 ? 'rgb(222, 134, 9)':
                      '';
}

/********************************** MAIN *****************************/

function draw_map(){
  var dataset_id    = $("#dataset_id").val(),
      dataset_title = $("dataset_title").val(),
      cur_mt        = $(".MeasureType:checked").first().val(),
      town_index    = -1,  //Remove town filter, since for a map we want all of them
      all_values    = [],
      number_of_classes = 8,
      filters       = get_filters();

  if (cur_mt == undefined) choose_measure_type_for_charts();

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

      var max = -Infinity;
      var min = 0;
      var asterisks_counter = 0;
      var geo_ids    = []
      var geo_names  = {}
      var value_counters = {}
      $.getJSON(map_json_url, function (geojson) {
        window.L_PREFER_CANVAS = true;

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

          if (data.data[i]['value'] > -1 && data.data[i]['value'] != '-9999')
            all_values.push(data.data[i]['value']);

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
        });

        if (geography_param != 'Town'){
          $.each(geo_ids, function(i){
            data.data.push({code: geo_names[geo_ids[i]], fips: geo_ids[i], value: -8888})
          });
        }


        $.each(data.data, function(i){
           if (geography_param != 'Town'){
            $.each(new_geojson.features, function(j){
              if (data.data[i] && new_geojson.features[j].properties['GEOID'] == data.data[i]['fips']){
                new_geojson.features[j].properties['Value'] = data.data[i]['value']
                new_geojson.features[j].properties["MOEs"]  = data.data[i]['moes']
              }
            })
          }
          else{
            $.each(new_geojson.features, function(j){
              name = new_geojson.features[j].properties['NAME']
              if (data.data[i] != undefined)
                code = data.data[i]['code']
              if (data.data[i] != undefined && name == code || name == code.substring(0, code.length - 1) ){
                value = data.data[i]['value']
                new_geojson.features[j].properties['Value'] = value
                new_geojson.features[j].properties["MOEs"]  = data.data[i]['moes']
              }
            })
          }
        });

        var keys = Object.keys(value_counters);
        var error = false
        $.each(keys, function(i){
          if (value_counters[keys[i]] > 1){
            error = true
            return  display_error('Please select more filters.')
          }
        });

        /**************************************** Draw Map *********************************************/

        step  = parseFloat((1/break_points.buckets).toFixed(2))
        array = [0]
        for (var i = 1; i < break_points.buckets; i++) {
          array.push(array[i-1] + step )
        };
        array.push(1)
        console.log(array)
        // get ranges
        if (break_points.type == 'jenks')
          legend_items = ss.jenks(all_values, break_points.buckets)
        else if (break_points.type == 'quintile' || break_points.type == 'quantile' || break_points.type == 'quartile')
          legend_items = ss.quantile(all_values, array)
        else if (break_points.type == 'array')
          legend_items = break_points.array

        layer = L.tileLayer('https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png', {
          minZoom: 9,
          maxZoom: 11,
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
            '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
            'Imagery © <a href="http://mapbox.com">Mapbox</a>',
          id: 'examples.map-20v6611k'
        })

        $("#container").html('<div id="map"></div>');

        var map = L.map('map',{layers: [layer] }).setView([41.571, -72.68], 1);

        // layer.addTo(map);

        map.fitBounds([
        [42.050942,-73.491669],
        [42.025033, -71.792908],
        [41.318878,-71.848183],
        [40.987213,-73.664703]
        ]);

        var stripes = new L.StripePattern({weight: 1});
        stripes.addTo(map);
        var mapCenter = new L.LatLng(42.050942,-73.491669);
        var circle = new L.Circle(mapCenter, 400.0, {
            fillPattern: stripes,
            stroke: false,
            fillOpacity: 0.5
        });
        circle.addTo(map);

        L.Icon.Default.imagePath = '/common/images'

        var info = L.control();

        info.onAdd = function (map) {
            this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
            this.update();
            return this._div;
        };

        // method that we will use to update the control based on feature properties passed
        info.update = function (props) {
          if (props ){
            var value = props['Value']
            if ((value == '-8888' || value == "") && value != 0) value = 'No value';
            var moes  = props["MOEs"];
            if (value == '-9999') value = 'Suppressed';

            value = unit_for_value(value, cur_mt)
            if (moes != '')
              moes  = "<span class='moes'>  ± " + unit_for_value(moes, cur_mt) + "</span>"
            this._div.innerHTML = '<h4><b>' + props['NAME'] + '</b><h4>' + value + ' ' + moes;
          } else
          this._div.innerHTML = '<h4> Hover over a сity </h4>'
        };

        info.addTo(map);

        var geojs;

        function highlightFeature(e) {
            var layer = e.target;

            layer.setStyle({
                weight: 1,
                color: 'rgba(21, 107, 16, 0.75)',
                dashArray: '',
                fillColor: 'rgba(21, 107, 16, 0.75)',
                fillOpacity: 1
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
                grades = legend_items,
                labels = [];
            div.innerHTML += '<i style="background: rgb(222, 134, 9)"></i> Suppressed <br>';
            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length -1 ; i++){
              div.innerHTML +=
                '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                grades[i] + ' &ndash; ' + grades[i + 1] + '<br>';
            }
            div.innerHTML += '<br> Breaks type: ' + break_points.type
            return div;
        };

        legend.addTo(map);
        L.easyPrint().addTo(map)
        $('.operations').hide();

        function style(feature) {
            value = feature.properties['Value']
            if ((value == '-8888' || value == "" || value == 'No value') && value != 0){
              return {
                  weight: 1,
                  opacity: 1,
                  color: '#767676',
                  fillOpacity: 0.9,
                  fillPattern: stripes,
              }
            } else {
                return  { weight: 1,
                  opacity: 1,
                  color: '#767676',
                  fillOpacity: 0.9,
                  fillColor: getColor(feature.properties['Value']),
                }
              }
        }


        geojs = L.geoJson(new_geojson, {style: style, onEachFeature: onEachFeature}).addTo(map);
        L.Util.requestAnimFrame(map.invalidateSize,map,!1,map._container); // fix zoom error

        hide_spinner();
      })
  });
}
