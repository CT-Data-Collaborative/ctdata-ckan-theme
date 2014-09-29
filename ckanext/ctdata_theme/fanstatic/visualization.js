var default_filters = ["Ashford", "Ansonia", "New Haven", "2008", "2009", "2010", "2011", "2012", "2013"];//, "K through 12", "1", "Percent", "Students absent 20 or more days", "8"];
var display_type = "table";
var test_incompat = { 
    "Grade":["Race\\\\\/ethnicity","Race\\\/ethnicity","EligibleforFreeandReducedPriceMeals","EnglishLanguageLearner","StudentswithDisabilities"],
    "Race\\\/ethnicity":["Grade","EligibleforFreeandReducedPriceMeals","EnglishLanguageLearner","StudentswithDisabilities"],
    "EligibleforFreeandReducedPriceMeals":["Race\\\\\/ethnicity","Race\\\/ethnicity","Grade","EnglishLanguageLearner","StudentswithDisabilities"],
    "EnglishLanguageLearner":["Race\\\\\/ethnicity","Race\\\/ethnicity","EligibleforFreeandReducedPriceMeals","Grade","StudentswithDisabilities"],
    "StudentswithDisabilities":["Race\\\\\/ethnicity","Race\\\/ethnicity","EligibleforFreeandReducedPriceMeals","EnglishLanguageLearner","Grade"],
    "Town":[],
    "Year":[],
    "MeasureType":[],
    "Variable":[]
     };
var incompat = {};

function set_display_type(new_type){
  display_type = new_type;
  display_data();
}

function handle_incompatibilities(){
  cur_incompat = [];
  cur_checked = $("input:checked");
  $.each(cur_checked, function(i){
    $.merge(cur_incompat, incompat[$(cur_checked[i]).attr('class')]);
  });
  all_dims = $('a.dimension');
  $.each(all_dims, function(i){
    $(all_dims[i]).css("pointer-events", "auto").css("color", "black");
  });
  $.each(cur_incompat, function(i){
    $('a[href="#collapse'+cur_incompat[i]+'"]').css("pointer-events", "None");
    $('a[href="#collapse'+cur_incompat[i]+'"]').css("color", "#D0D0D0");
    $("div.collapse[id='collapse"+cur_incompat[i]+"']").collapse('hide');
  });
}

function collapse_all(){
  $("div.collapse").collapse('hide');
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
            data: JSON.stringify({view: 'table',
                                  filters: get_filters()
                                  }),
            contentType: 'application/json; charset=utf-8'}).done(function(data) {
        //var series = data['data'],
        //    years = data['years'];
        var series = []
        var multifield = data['multifield'];
        var years = data['years'];
        var mf_data = data['data'];
        $.each(mf_data, function(town_index){
          var cur_town_name = mf_data[town_index]['town'];
          var cur_town = mf_data[town_index]['multifield'];
          $.each(cur_town, function(mf_index){
            var cur_mf_value = cur_town[mf_index]['value'];
            series.push({name: cur_town_name + ", "+multifield+": "+cur_mf_value,
                         data: cur_town[mf_index]['data'][0]['data']});
          });
        });
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
    $('div.collapse').collapse('hide');
    $('input[type="checkbox"]').change(function(){
        display_data();
        handle_incompatibilities();  
    });
    
    incompat = test_incompat;

    display_data();
});
