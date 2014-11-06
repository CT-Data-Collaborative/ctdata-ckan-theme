var display_type = "table";
var map_filters = [];
var chart_filters = [];

function select_all(){
  $('.select-all').on('click', function(){
    $this = $(this)
    $ul   = $this.closest('ul')

    $('input', $ul).prop('checked', true);
    display_data();
  });
}

function deselect_all(){
  $('.deselect-all').on('click', function(){
    $this = $(this)
    $ul   = $this.closest('ul')

    $('input', $ul).prop('checked', false);
    display_data();
    hide_spinner();
  });
}

function check_defaults(){
    $.each(defaults, function(i){

    if(defaults[i] instanceof Array){
      $.each(defaults[i], function(j){
        $("input."+i.replace(/ /g, '')+"[value='"+defaults[i][j]+"']").prop('checked', true);
      });
    } else {
        $("input."+i.replace(/ /g, '')+"[value='"+defaults[i]+"']").prop('checked', true);
    }
    });
    display_data();

}

function save_filters(display_type){
  if(display_type == 'map')
   map_filters = get_filters()
 else
   chart_filters = get_filters()
}

function set_filters(display_type){
  filters_to_update = []
  if(display_type == 'map' && map_filters.length > 0){
    filters_to_update = map_filters;
  }
  if(display_type != 'map' && chart_filters.length > 0){
    filters_to_update = chart_filters;
  }
  if(filters_to_update.length > 0){
    $.each(filters_to_update, function(i){
      column = filters_to_update[i]
      $.each(column['values'], function(value){
        $("input."+column['field']+"[value='"+column['values'][value]+"']").prop('checked', true);
      });
    });
  }
}

function set_display_type(new_type){
  set_icon(new_type);
  save_filters(display_type);
  set_filters(new_type);
  display_type = new_type;
  if (display_type == 'map'){
      set_map_checkbox();
    }else if (display_type == 'column' || display_type == 'line'){
      reset_checkbox();
      set_chart_checkbox();
  }
  else{
      //In table view
      reset_checkbox();
  }
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

function print_chart(){
    var chart = $("#container").highcharts();
    chart.print();
}
function save_chart_image(){
    var chart = $("#container").highcharts();
    var opts = {type:"image/png"};
    chart.exportChart(opts);
}
function save_chart_pdf(){
    var chart = $("#container").highcharts();
    var opts = {type: "application/pdf"};
    chart.exportChart(opts);
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
  });
}

function display_error(message){
  $("#container").html("<div id='error_message'>"+message+"</div>");
}

function display_data(){
  display_filters();
  display_spinner();
  if(display_type == 'column'){
    new_type = 'bar';
  } else {
    new_type = display_type
  }
    if(disabled.indexOf(new_type) != -1){
      display_error("This visualization is disabled for this dataset")
      return 0;
    }
  towns = $("input.Town:checked");
  years = $("input.Year:checked");
  if(towns.length == 0)
    return display_error("Please select a town");
  else if (years.length == 0)
    return display_error("Please select a year");
  switch(display_type){
    case "map":
     //Show the print and save icons
      $(".operations").css("visibility","visible");
      draw_map();
      break;
    case "table":
      //Don't show the print and save icons
      $(".operations").css("visibility","hidden");
      draw_table();
      break;
    default:
      //Show the print and save icons
      $(".operations").css("visibility","visible");
      draw_chart();
  }
}
/*
function check_defaults(){
  $.each(default_filters, function(i){
    $("li.filter").find("input[value='"+default_filters[i]+"']").prop('checked', true);
    });
  $(".MeasureType").first().prop('checked', true);
  $(".Variable").first().prop('checked', true);
}
*/
function get_filters(){
  var filters = [];
  dimensions = $("li.filter");

  $.each(dimensions, function(i){
    var cur_dim = $(dimensions[i]);
    var cur_filter = {'field': cur_dim.find('a').text().replace('Select AllDeselect All', ''), 'values': []};
    var checked = cur_dim.find("input:checked")

    $.each(checked, function(option){
      cur_filter['values'].push(checked[option].value);
    });

    if(checked.length != 0)
      filters.push(cur_filter);
  });
  return filters;
}

function handle_incompatibilities(compatibles){

  all_inputs = $("input[type='checkbox']");
  $.each(all_inputs, function(i){
    if($.inArray($(all_inputs[i]).val(), compatibles) != -1){
      $(all_inputs[i]).removeAttr("disabled");
      $(all_inputs[i]).parent().find("label").css("color", "gray");
    }else{
      $(all_inputs[i]).attr("disabled", true);
      $(all_inputs[i]).parent().find("label").css("color", "lightgray");
    }
  });

}

function draw_table(){
  var dataset_id = $("#dataset_id").val(),
      dataset_title = $("dataset_title").val();
  $.ajax({type: "POST",
          url: "/data/"+dataset_id,
          data: JSON.stringify({view: 'chart',
                               filters: get_filters()
                               }),
          contentType: 'application/json; charset=utf-8'}).done(function(data) {


      handle_incompatibilities(data['compatibles']);

      first_idx = 0;
      while(data['data'][first_idx] && !data['data'][first_idx]['dims'])
        first_idx++;
      if(!data['data'][first_idx])
        return display_error("No results, please select different filters");
      all_dims = data['data'][first_idx]['dims'];
      selected_dims = {};

     $.each(data['data'], function(d){
        $.each(all_dims, function(dim_name){
          if(data['data'][d]['dims']){
          if((data['data'][d]['dims'][dim_name] != "NA" && data['data'][d]['dims'][dim_name] != "All" && dim_name != "Town")){
            selected_dims[dim_name] = all_dims[dim_name];
          }
          }
        });
      });
      var years = data['years'];
      var col_num = 2;
      var html = '<table id="table" class="results_table">'+
                 "<thead>"+
                   "<tr>"+
                     "<th class='col-1'>Location</th>";
                   $.each(selected_dims, function(dim_name){
                     html += "<th class='col-"+col_num+"'>"+dim_name+"</th>";
                     col_num++;
                   });
                 if (years !== undefined) {
                   $.each(years, function (i) {
                       html = html + "<th class='col-" + (col_num + i) + "'>" + years[i] + "</th>";
                   });
                 } else {
                   html = html + "<th class='col-" + (col_num) + "'>Value</th>";
                 }
                 html+=  "</tr>"+
                 "</thead>"+
                 "<tbody>";
        $.each(data['data'], function(row_index){
          if (!data['data'][row_index]['dims']) return "No data for this row";
          col_num = 2;
          html += "<tr>"+
                    "<td class='col-1'>"+data['data'][row_index]['dims']['Town']+"</td>";
          $.each(selected_dims, function(dim_name){
               html += "<td class='col-"+col_num+"'>"+data['data'][row_index]['dims'][dim_name]+"</td>";
               col_num++;
          });
          if (years !== undefined) {
            $.each(years, function (year_index) {
              cur_value = data['data'][row_index]['data'][year_index];
              if (!cur_value) cur_value = "-";
              html += "<td class='col-" + col_num + "'>" + cur_value + "</td>";
              col_num++;
            });
          } else {
            cur_value = data['data'][row_index]['data'][0];
            html += "<td class='col-" + col_num + "'>" + cur_value + "</td>";
          }
        });
     html = html+"</tbody></table>";
      $("#container").html(html);
      $("#table").DataTable({
        dom: 'T<"clear">lfrtip',
        tableTools:{
          "sSwfPath": "/common/swf/copy_csv_xls_pdf.swf",
          "aButtons": ["print", "pdf", "csv"]
        }
      });
  hide_spinner();
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
          else
            suffix = '';
          delete cur_series_dims['Measure Type'];
          name = "<div id='legendTown'>"+ cur_series_dims['Town'] + "<div id='legendDims'>";
          delete cur_series_dims['Town'];
          var first_flag = 0;
          town = cur_series_dims
          $.each(cur_series_dims, function(dim_index){
            if (cur_series_dims[dim_index] == "NA")
              return "No value for this dimension"
            // name += dim_index + ": "+cur_series_dims[dim_index]+"<br> ";
            name += ',' + cur_series_dims[dim_index];
          });

          name += "</div>";
          cur_series['name'] = name;
          series.push(cur_series);
        });

        if(series.length == 0)
          return display_error("No results, please select different filters");
        yAxisLabel = $(".MeasureType:checked").first().val();

        hide_spinner();
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
                layout: 'horizontal',
                verticalAlign: 'bottom',
                borderWidth: 0,
                maxHeight: 90
            },
            tooltip: {
                useHTML: true,
                valueSuffix: suffix
            },
            series: series
        });
    });
}

function display_spinner(){
  $('.spinner').show();
  $('.results_table').hide();
}

function hide_spinner(){
  $('.spinner').hide();
  $('.results_table').show();
}

function display_filters(){
  filters = get_filters();
  filter_text = "";
  $.each(filters, function(i){
    if (filters[i]['field'] == "Town") return "Skip town";
    filter_text += filters[i]['field']+": "+filters[i]['values'] + " | ";
  });
  filter_text = filter_text.replace('Select AllDeselect All', '').substring(0, filter_text.length - 2);
  $("#pageDescription").text(filter_text);

  $li = $('li#Connecticut')
  $li.prependTo($li.closest('ul')[0]);

}

$(function () {
    select_all();
    deselect_all();
    check_defaults();
    $('.filter div.collapse').collapse('hide');
    $('input[type="checkbox"]').change(function(){
        display_data();
    });

});
