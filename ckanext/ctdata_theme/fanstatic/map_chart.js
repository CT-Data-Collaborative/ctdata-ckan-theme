var chart;

function draw_map() {
var dataset_id = $("#dataset_id").val(),
    dataset_title = $("dataset_title").val();

filters = get_filters();
$.each(filters, function(i){
  if(filters[i]['field'] == "Town")
    filters[i]['values'] = ['all'];
  });

$.ajax({type: "POST",
        url: "/data/" + dataset_id,
        data: JSON.stringify({view: 'chart',
                              filters: filters
                             }),
        contentType: 'application/json; charset=utf-8'}).done(function(    data) {

var max = -Infinity;
var min = Infinity;
$.each(data.data, function(i){
  data.data[i]['value'] = data.data[i]['data'][0];
  if(data.data[i]['data'][0] > max)
    max = data.data[i]['data'][0];
  if(data.data[i]['data'][0] < min)
    min = data.data[i]['data'][0];
});

//Split data into classes for discrete map coloring
var numClasses = 8;
var range = max-min;
var step = Math.ceil(range/numClasses);
var dataClasses = []
for(i = 0; i < numClasses; i++){
  dataClasses.push({from: Math.floor(min+(step*i)),
                    to:   Math.floor(min+(step*(i+1)))
                    });
}
dataClasses[dataClasses.length-1]['to'] = max+1;

$.getJSON('/common/map.json', function (geojson) {

//Create legend to display current filters
var legend_html = '<div id="mapLabel">'+$("#dataset_title").val()+"<br>"+
  '<div style="font-size:9px">';
var cur_filters = get_filters();
$.each(cur_filters, function(i){
  if (cur_filters[i].field == 'Town') return "Skip this filter";
  legend_html += cur_filters[i].field + 
         ": " + cur_filters[i].values + " | ";
});
legend_html = legend_html.substring(0, legend_html.length-2);
legend_html += "</div></div>"

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
  title : {
    text : dataset_title
  },

  mapNavigation: {
    enabled: false,
  },
  colorAxis: {
    dataClasses: dataClasses
  },
  legend: {
    title: {text: legend_html,
            style: {fontFamily: "Questrial, sans-serif", textWrap: "normal"}},
    useHTML: true,
    floating: true,
    backgroundColor: 'white',
    valueDecimals: 0,
    width: 430,
    align: "right",
    borderWidth:1,
    borderRadius:3,
    itemWidth:100,
    y: -10
  },
  xAxis:{
    labels: {enabled: false},
    gridLineWidth: 0,
    max: -71.787239,
    min: -73.727775,
    minRange: 1,
  },
  yAxis:{
    title:{text:''},
    labels: {enabled: false},
    gridLineWidth: 0,
    max: -40.950943,
    min: -42.050587,
    minRange: 1,
  },
  exporting: {enabled: false},
   series : [{
    data : data.data,
    mapData: geojson,
    borderColor: '#666666',
    name: data['years'][0],
    joinBy: ['NAME', 'name'],
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

//add gray map background
$(".highcharts-container").css({
      backgroundImage: "url('/common/images/graymap.png')",
      backgroundSize: "1076px 700px",
      backgroundPosition: "-224px -42px"
      });
});
});
}
