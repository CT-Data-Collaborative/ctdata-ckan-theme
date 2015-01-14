var chart;

function swap(array,i,j){
  temp = array[i]
  array[i] = array[j]
  array[j] = temp
}
function draw_map() {
var dataset_id = $("#dataset_id").val(),
    dataset_title = $("dataset_title").val();

filters = get_filters();
//Remove town filter, since for a map we want all of them
var town_index = -1;
$.each(filters, function(i){
  if(filters[i]['field'] == geography_param)
    town_index = i
});
if (town_index >= 0)
  filters.splice(town_index, 1)

$.ajax({type: "POST",
        url: "/vizualization_data/" + dataset_id,
        data: JSON.stringify({view: 'map',
                              filters: filters
                             }),
        contentType: 'application/json; charset=utf-8'}).done(function(data) {


if (data.data.length == 0){
  console.log('here')
  hide_spinner()
  return display_error('Map view is not available')
}

change_page_url(data['link']);
handle_incompatibilities(data['compatibles']);
var max = -Infinity;
var min = 0;
var asterisks_counter = 0;
var geo_ids = []
var geo_names = {}
$.getJSON('/common/map.json', function (geojson) {

  if (geography_param != 'Town'){
    $.each(geojson['features'], function(i){
      id   = geojson['features'][i]['properties']['GEOID']
      name = geojson['features'][i]['properties']['NAME']
      geo_ids.push(id)
      geo_names[id] = name
    });
  }

$.each(data.data, function(i){

  if (geography_param != 'Town'){
    if (geo_ids.indexOf(data.data[i]['fips']) > -1){
      geo_ids.splice(geo_ids.indexOf(data.data[i]['fips']), 1)
    }
  }

  if (data.data[i]['code'] == "Connecticut"){
    delete data.data[i];
    return "Skip data for all of connecticut"
  }
  if (data.data[i]['value'] == SUPPRESSED_VALUE){
    data.data[i]['value'] = '*'
    asterisks_counter++;
    return "Skip supressed data"
  }
  if(data.data[i]['value'] > max)
    max = data.data[i]['value'];
  if(data.data[i]['value'] < min)
    min = data.data[i]['value'];
});

if (geography_param != 'Town'){
  $.each(geo_ids, function(i){
    data.data.push({code: geo_names[geo_ids[i]], fips: geo_ids[i], value: 'No value'})
  });
}

//Split data into classes for discrete map coloring
var cur_mt = $(".MeasureType:checked").first().val(),
    cur_mt_is_number  = (cur_mt == "number"  || cur_mt == "Number"),
    cur_mt_is_percent = (cur_mt == "percent" || cur_mt == "Percent" || cur_mt == undefined),
    numClasses        = 8,
    range             = max-min,
    step              = 0,
    dataClasses       = [],
    colors            = ['rgb(239,239,255)', 'rgb(171,187,216)', 'rgb(137,161,196)', 'rgb(102,134,176)',
                         'rgb(68,108,156)', 'rgb(34,82,137)', 'rgb(0,56,117)', 'rgb(1, 35, 73)'];


if (!cur_mt_is_percent)
  step = (Math.round(Math.ceil((range)/numClasses)/10))*10
else
  step = Math.ceil(range/numClasses)

// Data Class for Supressed data
if (asterisks_counter > 0) dataClasses.push({name: 'Suppressed', color: 'rgba(222, 134, 9, 1)', to: '*'});

for(i = 0; i < numClasses; i++){
  to   = Math.floor(min+(step*(i+1)))
  from = Math.floor(min+(step*i))

  if (!cur_mt_is_percent ){
    if (to > 100  && i != 7)  to = Math.round(to/10)*10;
    if (i == 7) to = max;
    if (from > 100) from = Math.round(from/10)*10;
  }

  if (to > 100 && cur_mt_is_percent)
    to = 100
  dataClasses.push({name: unit_for_value(from, cur_mt) + ' - ' + unit_for_value(to, cur_mt),
                    from: from, to: to, color: colors[i] });
}

if(dataClasses[dataClasses.length-1]['to'] < max+1 && cur_mt_is_number)
  dataClasses[dataClasses.length-1]['to'] = max+1;

//Create legend to display current filters
var legend_html = "<div>" ,
    cur_filters = get_filters();
$.each(cur_filters, function(i){
  if (cur_filters[i].field == geography_param) return "Skip this filter";
  legend_html += cur_filters[i].field + ": " + cur_filters[i].values + " | ";
});

legend_html = legend_html.substring(0, legend_html.length-2);
legend_html += "</div>"

var units = "";
if (cur_mt_is_number && ($("#dataset_id").val() == 'cmt-results' || $("#dataset_id").val() == 'chronic-absenteeism'))
  units = " Students";

var series_name = 'value';
if (data['years'] !== undefined)
  series_name = data['years'][0];


sortedDataClasses = dataClasses

// sort DataClasses to show in normal order
  swap(sortedDataClasses,1,2)
  swap(sortedDataClasses,1,4)
  swap(sortedDataClasses,3,6)
if (sortedDataClasses.length == 8){
  swap(sortedDataClasses,5,3)
} else{
  swap(sortedDataClasses,1,8)
  swap(sortedDataClasses,5,1)
  swap(sortedDataClasses,5,7)
}
if (geography_param != 'Town'){
  sortedDataClasses.push({name: 'No value', color: '#D8D8D8', to: 'No value', showInLegend: false});
}
// Initiate the chart

var join_by = ['NAME', 'code'];

if (geography_param != 'Town')
  join_by = ['GEOID', 'fips'];


chart = new Highcharts.Chart({
  chart: {
    renderTo: 'container',
    type: 'map',
    width: 634, //-99
    height: 553, //-139
    backgroundColor:null,
    animation: false
  },
  mapNavigation: {
    enabled: false,
  },
  colorAxis: {
    dataClasses: sortedDataClasses
  },
  tooltip:{
    valueSuffix: units
  },
  title : {
    text : $("#dataset_title").val(),
    style: {opacity: "70%", fontFamily: "Questrial, sans-serif", textWrap: "normal", fontWeight: '900',zIndex: '999', fontSize: '24px'},
    floating: true,
    backgroundColor: 'white',
    borderWidth:1,
    borderRadius:3,
    useHTML: true,
    y: 30
  },
  subtitle: {
    text: legend_html,
    style: {opacity: "70%", fontFamily: "Questrial, sans-serif", backgroundColor: '#ffffff', padding: '5px', paddingTop: '40px', minWidth: '500px', textAlign: 'center', border: '1px solid lightgray'},
    floating: true,
    backgroundColor: 'white',
    borderWidth:1,
    borderRadius:3,
    useHTML: true,
    y: 10
  },

  legend: {
    labelFormat: "{name}" + units,
    useHTML: true,
    floating: true,
    backgroundColor: 'white',
    valueDecimals: 0,
    width: 600,
    align: "right",
    borderWidth:1,
    borderRadius:3,
    itemWidth:300,
    y: 10
  },
  xAxis:{
    labels: {enabled: false},
    gridLineWidth: 0,
    max: -71.787239,
    min: -73.727775,
    minRange: 1,
    lineColor: 'transparent',
    tickColor: 'transparent'
  },
  yAxis:{
    title:{text:''},
    labels: {enabled: false},
    gridLineWidth: 0,
    max: -40.950943,
    min: -42.050587,
    minRange: 1,
    lineColor: 'transparent',
    tickColor: 'transparent'
  },
  tooltip: {
    formatter: function () {
      value = this.point.value
      if (this.point.value == '*'){
        value = 'Suppressed'
      }
      if (value != 'No value'){
        return '<b>' + this.series.name + '</b><br>' +
             this.point.code + '<br>' +
             'Value: <b>' + unit_for_value(value, cur_mt) + '</b>';
      }else{
        return this.point.code + '<br>' + 'Value: <b>' + unit_for_value(value, cur_mt) + '</b>';
      }
    }
  },
  exporting: {enabled: false},
   series : [{
    data : data.data,
    mapData: geojson,
    borderColor: '#666666',
    name: series_name,
    joinBy: join_by,
    states: {
      hover: {
        color: 'highlight',
      }
    },
     dataLabels: {
    }
  }]
});
chart.xAxis[0].setExtremes(-74, -71.5, false);
chart.yAxis[0].setExtremes(-42.2, -40.8, false);
chart.redraw();


function change_color(){
  $('path[fill="#7cb5ec"]').attr('fill', '#F9F9F9');
}
setTimeout(change_color(),1000)
hide_spinner();
//add gray map background
$(".highcharts-container").css({
      backgroundImage: "url('/common/images/graymap.png')",
      backgroundSize: "1076px 700px",
      backgroundPosition: "-224px -42px"
      });
});
});
}


