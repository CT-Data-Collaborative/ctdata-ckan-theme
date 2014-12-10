var chart;

function draw_map() {
var dataset_id = $("#dataset_id").val(),
    dataset_title = $("dataset_title").val();

filters = get_filters();
//Remove town filter, since for a map we want all of them
var town_index = -1;
$.each(filters, function(i){
  if(filters[i]['field'] == "Town")
    town_index = i
});
if (town_index >= 0)
  filters.splice(town_index, 1)

$.ajax({type: "POST",
        url: "/vizualization_data/" + dataset_id,
        data: JSON.stringify({view: 'map',
                              filters: filters
                             }),
        contentType: 'application/json; charset=utf-8'}).done(function(    data) {
handle_incompatibilities(data['compatibles']);
var max = -Infinity;
var min = 0;
var asterisks_counter = 0;

$.each(data.data, function(i){
  if (data.data[i]['code'] == "Connecticut"){
    delete data.data[i];
    return "Skip data for all of connecticut"
  }
  if (data.data[i]['value'] == '*'){
    asterisks_counter++;
    return "Skip supressed data"
  }
  if(data.data[i]['value'] > max)
    max = data.data[i]['value'];
  if(data.data[i]['value'] < min)
    min = data.data[i]['value'];
});

//Split data into classes for discrete map coloring
var cur_mt = $(".MeasureType:checked").first().val(),
    cur_mt_is_number  = (cur_mt == "number" && cur_mt == "Number"),
    cur_mt_is_percent = (cur_mt == "percent" || cur_mt == "Percent"),
    numClasses        = 8,
    range             = max-min,
    step              = Math.ceil(range/numClasses),
    dataClasses       = [];

// Data Class for Supressed data
if (asterisks_counter > 0) dataClasses.push({name: 'Supressed', color: 'rgba(222, 134, 9, 1)', to: '*'});

for(i = 0; i < numClasses; i++){
  to   = Math.floor(min+(step*(i+1)))
  from = Math.floor(min+(step*i))

  if (to.toString().length > 3)   to   = Math.floor(to/100)*100;
  if (from.toString().length > 3 && from != max) from = Math.floor(from/100)*100;

  dataClasses.push({from: from, to:  to > 100 && cur_mt_is_percent && 100 || to });
}

if(dataClasses[dataClasses.length-1]['to'] < max+1 && cur_mt_is_number)
  dataClasses[dataClasses.length-1]['to'] = max+1;

$.getJSON('/common/map.json', function (geojson) {

//Create legend to display current filters
var legend_html = "<div>" ,
    cur_filters = get_filters();
$.each(cur_filters, function(i){
  if (cur_filters[i].field == 'Town') return "Skip this filter";
  legend_html += cur_filters[i].field + ": " + cur_filters[i].values + " | ";
});

legend_html = legend_html.substring(0, legend_html.length-2);
legend_html += "</div>"

var units = "";
if (cur_mt_is_percent) units = "%";
if (cur_mt_is_number && ($("#dataset_id").val() == 'cmt-results' || $("#dataset_id").val() == 'chronic-absenteeism'))
  units = " Students";

var series_name = 'value';
if (data['years'] !== undefined)
  series_name = data['years'][0];

// Initiate the chart
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
    dataClasses: dataClasses
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

      return '<b>' + this.series.name + '</b><br>' +
             this.point.name + '<br>' +
             'Value: <b>' + value + '</b>';
    }
  },
  exporting: {enabled: false},
   series : [{
    data : data.data,
    mapData: geojson,
    borderColor: '#666666',
    name: series_name,
    joinBy: ['NAME', 'code'],
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
