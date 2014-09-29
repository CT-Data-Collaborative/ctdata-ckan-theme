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
console.log(data);
$.each(data.data, function(i){
  data.data[i]['value'] = data.data[i]['data'][0];
});

$.getJSON('/common/map.json', function (geojson) {
// Initiate the chart
chart = new Highcharts.Chart({
  chart: {
    renderTo: 'container',
    type: 'map',
    width: 800, //-99
    height: 520 //-139
  },
  title : {
    text : dataset_title
  },

  mapNavigation: {
    enabled: false,
    buttonOptions: {
      verticalAlign: 'bottom'
    }
  },
  colorAxis: {
  },
  xAxis:{
    labels: {enabled: false},
    gridLineWidth: 0,
    max: -71.787239,
    min: -73.727775,
    minRange: 1,
    events:{
    afterSetExtremes: function(){
      if(this.dataMin < -73.727775){
        this.dataMin = -73.727775
        }
      if(this.dataMax > -71.787239){
        this.dataMax = -71.787239
        }
    }
    }
  },
  yAxis:{
    title:{text:''},
    labels: {enabled: false},
    gridLineWidth: 0,
    max: -40.950943,
    min: -42.050587,
    minRange: 1,
    events:{
    afterSetExtremes: function(){
      if(this.dataMin < -42.050587){
        this.dataMin = -42.050587
        }
      if(this.dataMax > -40.950943){
        this.dataMax = -40.950943
        }
    }
    }
  },
  exporting: {enabled: false},
   labels: {items:[
               {html: "<div id='mapLegend'>THIS IS A TEST</div>",
                style:{left: '100px', top: '100px'}}
                ]},
    series : [{
    data : data.data,
    mapData: geojson,
    borderColor: '#666666',
    name: data['years'][0],
    joinBy: ['NAME', 'name'],
    states: {
      hover: {
        color: '#BADA55',
        enabled: false
      }
    },
     dataLabels: {
//        enabled: true,
//       format: '{point.properties.postal}'
    }
  }]
});
chart.xAxis[0].setExtremes(-74, -71.5, false);
chart.yAxis[0].setExtremes(-42.2, -40.8, false);
chart.redraw();
});
});
}
