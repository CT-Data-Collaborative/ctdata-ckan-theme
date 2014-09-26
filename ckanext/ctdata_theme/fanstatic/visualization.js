var default_filters = ["Ashford", "Ansonia", "New Haven", "2008", "2009", "2010", "2011", "2012", "2013", "K through 12", "1", "Percent", "Students absent 20 or more days"];
var display_type = "table";

function set_display_type(new_type){
  display_type = new_type;
  display_data();
}

function display_data(){
  switch(display_type){
    case "map":
      draw_map();
      break;
    case "table":
      draw_table();
      break;
    default:
      draw_chart();
  }
}

function check_defaults(){
  $.each(default_filters, function(i){
    $("li.filter").find("input[value='"+default_filters[i]+"']").prop('checked', true);
    });
}

function get_filters(){
  var filters = [];
  dimensions = $("li.filter");
 
  $.each(dimensions, function(i){
    var cur_dim = $(dimensions[i]);
    var cur_filter = {'field': cur_dim.find('a').text(), 'values': []};
    var checked = cur_dim.find("input:checked")
  
    $.each(checked, function(option){
      cur_filter['values'].push(checked[option].value);
    });
    
    if(checked.length != 0)
      filters.push(cur_filter);
  });
  return filters;
}

function draw_table(){
  var dataset_id = $("#dataset_id").val(),
      dataset_title = $("dataset_title").val();
  $.ajax({type: "POST",
          url: "/data/"+dataset_id,
          data: JSON.stringify({view: 'table',
                               filters: get_filters()
                               }),
          contentType: 'application/json; charset=utf-8'}).done(function(data) {

      console.log(data);
      var multifield = data['multifield'];
      var html = '<table id="table" class="results_table">'+
                 "<thead>"+
                   "<tr>"+
                     "<th class='col-1'>Location</th>"+
                     "<th class='col-2'>Year</th>"+
                     "<th class='col-3'>"+multifield+"</th>"+
                     "<th class='col-4'>Measure Type</th>"+
                     "<th class='col-5'>Value</th>"+
                   "</tr>"+
                 "</thead>"+
                 "<tbody>";
      $.each(data['data'], function(town_index){
        town = data['data'][town_index];
        $.each(town['multifield'], function(mf_index){
          mf = town['multifield'][mf_index];
            $.each(mf['data'], function(mt_index){ 
              mt = mf['data'][mt_index];
              $.each(mt['data'], function(value_index){
              value = mt['data'][value_index];
              html = html+
                 "<tr>"+
                   "<td class='col-1'>"+town['town']+"</td>"+
                   "<td class='col-2'>"+data['years'][value_index]+"</td>"+
                   "<td class='col-3'>"+mf['value']+"</td>"+
                   "<td class='col-4'>"+mt['measure_type']+"</td>"+
                   "<td class='col-5'>"+value+"</td>"+
                 "</tr>";
              });
            });
        });
      });
      html = html+"</tbody></table>";
      $("#container").html(html);
      $("#table").DataTable()
});
}

function draw_chart(){
  var dataset_id = $("#dataset_id").val(),
      dataset_title = $("dataset_title").val();

  $.ajax({type: "POST",
            url: "/data/" + dataset_id,
            data: JSON.stringify({view: 'chart',
                                  filters: get_filters()
                                  }),
            contentType: 'application/json; charset=utf-8'}).done(function(data) {
        var series = data['data'],
            years = data['years'];

        console.log(years);
        console.log(series);

        $('#container').highcharts({
            chart: {
              type: display_type
            },
            title: {
                text: dataset_title,
                x: -20 //center
            },
            xAxis: {
                categories: years
            },
            yAxis: {
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: series
        });
    })

}

$(function () {
    check_defaults()
    $('input[type="checkbox"]').change(function(){
        //Only one checkbox per dimension can be checked 
//        if($(this).prop('checked')){
//           $(this).parent().parent().find('input').prop('checked', false);
//           $(this).prop('checked', true);
//        }
        display_data();
    });
    display_data();
});
