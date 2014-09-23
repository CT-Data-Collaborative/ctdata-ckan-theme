var chart;
function draw_map() {


// Prepare random data
var data = [
  {
    "code": "Clinton",
    "value": 728
  },
  {
    "code": "Ashford",
    "value": 223
  },
  {
    "code": "Andover",
    "value": 432
  },
  {
    "code": "New Haven",
    "value": 645
  }
];

$.getJSON('/common/map.json', function (geojson) {

// Initiate the chart
chart = new Highcharts.Chart({
  chart: {
    renderTo: 'container',
    type: 'map',
    width: 600,
    height: 400
  },
  title : {
    text : 'Map'
  },

  mapNavigation: {
    enabled: true,
    buttonOptions: {
      verticalAlign: 'bottom'
    }
  },

  colorAxis: {
  },
  xAxis:{
    max: -71.5,
    min: -74,
    minRange: 1,
    events:{
    afterSetExtremes: function(){
      if(this.dataMin < -74){
        this.dataMin = -74
        }
      if(this.dataMax > -71.5){
        this.dataMax = -71.5
        }
    }
    }
  },
  yAxis:{
    max: -40,
    min: -43,
    minRange: 1,
    events:{
    afterSetExtremes: function(){
      if(this.dataMin < -43){
        this.dataMin = -43
        }
      if(this.dataMax > -40){
        this.dataMax = -40
        }
    }
    }

  },

  series : [{
    data : data,
    mapData: geojson,
    joinBy: ['NAME', 'code'],
    name: 'Random data',
    states: {
      hover: {
        color: '#BADA55'
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
}
