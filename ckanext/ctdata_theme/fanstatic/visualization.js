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
  set_icon(new_type);
  display_type = new_type;
  if (display_type == 'map')
      set_map_checkbox();
  else if (display_type == 'column' || display_type == 'line'){
      reset_checkbox();
      set_chart_checkbox();
  }
  else
      reset_checkbox();
  display_data();
}

function set_icon(type){
  if (type == "map") {
    $("#map_icon").attr("src", "/common/images/displayopt4-inv.png");
  } else {
    $("#map_icon").attr("src", "/common/images/displayopt4.png");
  }
  if (type == "column") {
    $("#bar_icon").attr("src", "/common/images/displayopt2-inv.png");
  } else {
    $("#bar_icon").attr("src", "/common/images/displayopt2.png");
  }
  if (type == "line") {
    $("#line_icon").attr("src", "/common/images/displayopt3-inv.png");
  } else {
    $("#line_icon").attr("src", "/common/images/displayopt3.png");
  }
  if (type == "table") {
    $("#table_icon").attr("src", "/common/images/displayopt1-inv.png");
  } else {
    $("#table_icon").attr("src", "/common/images/displayopt1.png");
  }
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

//Charts can't have more than one measure type at a time
function set_chart_checkbox(){
  $("input.MeasureType").click(function(){
    $(this).parent().parent().find("input[type='checkbox']").prop('checked', false);
    $(this).prop('checked', true);
    display_data();
    handle_incompatibilities();
  });
  $("input.MeasureType").unbind("change");
  $("input.MeasureType:checked").slice(1).prop('checked', false);
}

//If showing map, only allow one of each filter to be checked at a time
function set_map_checkbox(){
  $("input[type='checkbox']:not(.Town)").click(function(){
    var val = $(this).prop('checked');
    $(this).parent().parent().find("input[type='checkbox']").prop('checked', false);
    $(this).prop('checked', val);
    display_data();
    handle_incompatibilities();
  });
  $("input[type='checkbox']:not(.Town)").unbind("change");
  //Uncheck all but the first checked for each filter
  filter_lists = $('.filter');
  $.each(filter_lists, function(i){
    $(filter_lists[i]).find("input:checked:not(.Town)").slice(1).prop('checked', false);
  });
}

//When not showing map, allow multiple filters to be checked
function reset_checkbox(){
  $("input[type='checkbox']:not(.Town)").unbind("click");
  $('input[type="checkbox"]:not(.Town)').change(function(){
      display_data();
      handle_incompatibilities();  
  });
} 

function display_data(){
  display_filters();
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
  $(".MeasureType").first().prop('checked', true);
  $(".Variable").first().prop('checked', true);
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
      var years = data['years'];
      var html = '<table id="table" class="results_table">'+
                 "<thead>"+
                   "<tr>"+
                     "<th class='col-1'>Location</th>"+
                     "<th class='col-2'>"+multifield+"</th>";
      //If there is a variable field, include it in the table
      if (data['data'][0]['multifield'][0]['data'][0]['variable']){
                     html += "<th class='col-3'>Variable</th>";
         }
                     html += "<th class='col-4'>Measure Type</th>";
                 $.each(years, function(i){
                     html = html+"<th class='col-"+(i+5)+"'>"+years[i]+"</th>";
                 });
                 html+=  "</tr>"+
                 "</thead>"+
                 "<tbody>";
      $.each(data['data'], function(town_index){
        town = data['data'][town_index];
        $.each(town['multifield'], function(mf_index){
          mf = town['multifield'][mf_index];
          if(mf['value']=='NA') return "skip to next mf";
            $.each(mf['data'], function(mt_index){ 
              mt = mf['data'][mt_index];
              html = html+
                 "<tr>"+
                   "<td class='col-1'>"+town['town']+"</td>"+
                   "<td class='col-2'>"+mf['value']+"</td>";
             if (mt['variable'])
                   html += "<td class='col-3'>"+mt['variable']+"</td>";
             html += "<td class='col-4'>"+mt['measure_type']+"</td>";
              //For each year
              $.each(years, function(value_index){
               value = mt['data'][value_index];
               if(value == undefined) value="-";
               html += "<td class='col-"+(value_index+5)+"'>"+value+"</td>";
              });
               html +=  "</tr>";
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
        //var series = data['data'],
        //    years = data['years'];
        console.log("HERE IS CHART DATA");
        console.log(data);
        var suffix = '';
        var series = []
        var years = data['years'];
        var series_data = data['data'];
        $.each(series_data, function(i){
          if (!series_data[i]['dims'])
            return "This series doesn't exist"
          cur_series_data = series_data[i]['data'];
          cur_series_dims = series_data[i]['dims'];
          cur_series = {};
          cur_series['data'] = cur_series_data;
          suffix = cur_series_dims['Measure Type'];
          if (suffix == 'percent' || suffix == 'Percent')
            suffix = '%';
          delete cur_series_dims['Measure Type'];
          name = /*"<div id='legendTown'>"+*/cur_series_dims['Town'] + " -  <br> <div id='legendDims'>";
          delete cur_series_dims['Town'];
          var first_flag = 0;
          $.each(cur_series_dims, function(dim_index){
            if (cur_series_dims[dim_index] == "NA")
              return "No value for this dimension"
            name += dim_index + ": "+cur_series_dims[dim_index]+"<br> ";
          });
          name += "</div>";
          cur_series['name'] = name;
          series.push(cur_series);
        });

        console.log(years);
        console.log(series);
        yAxisLabel = $(".MeasureType:checked").first().val();

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
                }],
                title: {text: yAxisLabel}
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0,
                //useHTML: true,
                itemMarginBottom: 10
            },
            tooltip: {
                useHTML: true,
                valueSuffix: suffix
            },
            series: series
        });
    })

}

function display_filters(){
  filters = get_filters();
  filter_text = "";
  $.each(filters, function(i){
    if (filters[i]['field'] == "Town") return "Skip town";
    filter_text += filters[i]['field']+": "+filters[i]['values'] + " | ";
  });
  filter_text = filter_text.substring(0, filter_text.length - 2);
  $("#pageDescription").text(filter_text);
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
