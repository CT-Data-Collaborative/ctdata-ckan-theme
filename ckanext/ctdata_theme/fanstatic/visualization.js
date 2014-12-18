var display_type  =  (location.search.split('v=')[1]||'').split('&')[0] || "table",
    map_filters   = [],
    chart_filters = [],
    dataset_id    = $("#dataset_id").val(),
    create_popup  = $("#create_indicator_popup"),
    edit_popup    = $("#edit_indicators_popup");
    SUPPRESSED_VALUE = -9999;

window.ids_to_remove = [];

create_popup.modal({show: false});
edit_popup.modal({show: false});
$('.close_popup').click(function() {
  create_popup.modal('hide');
  edit_popup.modal('hide');
});

function show_selected_indicator(){
  ind_id = location.search.split('ind=')[1]
  if (ind_id != undefined){
    $('#'+ind_id + '.head_ind_link').prop('selected', true)
  }
}

function show_headline_popup(){
  $('#save_headline_indicator').on('click', function(){
    filters_hash = collect_filters_hash();
    html_text    = "<ul>"

    Object.keys(filters_hash).forEach(function (key) {
      html_text += "<li><h4>" + key + "</h4><small>" + filters_hash[key].join(', ') + "</small></li>"
    });
    html_text += "</ul>"
    $('#selected_filters').html(
      html_text
    );
    create_popup.modal('show');
  });
}

function show_edit_indicators_popup(){
  $('#edit_headline_indicators').on('click', function(){
    edit_popup.modal('show');
  });
}

function add_ind_id_to_removing_list(){
  $('.remove_indicator').on('click', function(){
    window.ids_to_remove.push( $(this).attr('id'));
    $(this).closest('div.control-group').hide();
  });
}

function update_headline_indicators(){
  $('#update_headline_indicators').on('click', function(){
    names_hash = {}

    $('.edit_name').map(function(){
        names_hash[$(this).attr('id')]= $(this).val();
    });


    $.ajax({type: "POST",
      url: "/dataset/"+dataset_id+"/update_indicators",
      data: JSON.stringify({ names_hash: names_hash,
                             indicators_to_remove: window.ids_to_remove}),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });

  })
}

function create_headline_indicator(){
  $('#create_headline_indicator').on('click', function(){
    filters = []
    Object.keys(filters_hash).forEach(function (key) {
      filters.push({field: key, values: filters_hash[key]})
    });

    $.ajax({type: "POST",
      url: "/community/add_indicator",
      data: JSON.stringify({ dataset_id: dataset_id, name: $('#indicator_name').val(),
                             headline: true, filters: filters}),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
          window.location.reload();
      }
    });

  });
}

function collect_filters_hash(){
  var hash       = {},
      checkboxes = $( "input:checked" );
  $( "input:checked" ).map(function(){
    key   = $(this).attr('name');
    value = $(this).attr('value');

    if (hash[key] == undefined )
      hash[key] = [value];
    else
      hash[key].push(value);
  });
  return hash;
}

function select_all(){
  $('.select-all').on('click', function(){
    $this = $(this)
    $ul   = $( 'ul', $this.closest('li.filter'))

    $('input', $ul).prop('checked', true);
    display_data();
  });
}

function deselect_all(){
  $('.deselect-all').on('click', function(){
    $this = $(this)
    $ul   = $('ul', $this.closest('li.filter'))

    $('input', $ul).prop('checked', false);
    display_data();
    hide_spinner();
  });
}

function check_defaults(){
    $.each(defaults, function(i){

    if(defaults[i] instanceof Array){
      $.each(defaults[i], function(j){

        $input = $("input[class*="+i.replace(/ /g, '')+"]"+'[value="'+defaults[i][j]+'"]');
        $input.prop('checked', true);
      });
    } else {
        $input = $("input[class*="+i.replace(/ /g, '')+"]"+'[value="'+defaults[i]+'"]');
        $input.prop('checked', true);
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
        $("input[class*="+column['field']+"]"+"[value='"+column['values'][value]+"']").prop('checked', true);
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
    $(filter_lists[i]).find("input:checked:not(.Town, .Year)").slice(1).prop('checked', false);
  });

  //Check most recent year
  values = []
  $("input:checked.Year").map(function(){
    values.push(parseInt($(this).val()))
  });
  max_year = Math.max.apply(null, values).toString()

  $("input:checked.Year").prop('checked', false);
  $("input:#"+ max_year +"Check.Year").prop('checked', true);
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
  set_icon(display_type);

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
  if(towns.length == 0){
    hide_spinner();
    return display_error("Please select a town");
  }
  else if (years.length == 0){
    hide_spinner();
    return display_error("Please select a year");
  }

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
          url: "/vizualization_data/"+dataset_id,
          data: JSON.stringify({view: 'table',
                               filters: get_filters(),
                               omit_single_values: true
                               }),
          contentType: 'application/json; charset=utf-8'}).done(function(data) {


      handle_incompatibilities(data['compatibles']);
      change_page_url(data['link']);
      first_idx = 0;
      while(data['data'][first_idx] && !data['data'][first_idx]['dims'])
        first_idx++;
      if(!data['data'][first_idx]) {
        hide_spinner();
        return display_error("No results, please select different filters");
      }
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
          html += "<tr>"+ "<td class='col-1'>"+data['data'][row_index]['dims']['Town']+"</td>";
          $.each(selected_dims, function(dim_name){
               html += "<td class='col-"+col_num+"'>"+data['data'][row_index]['dims'][dim_name]+"</td>";
               col_num++;
          });
          if (years !== undefined) {
            $.each(years, function (year_index) {
              cur_value = data['data'][row_index]['data'][year_index];
              if (!cur_value) cur_value = "-";
              if (cur_value == SUPPRESSED_VALUE) cur_value = '*'

              text = cur_value.toString()
              array = text.split('.')

              if (jQuery.isNumeric(text) == true && array.length == 1){
                cur_value = parseInt(text).toLocaleString('en-US')
              }

              type = data['data'][row_index]['dims']['Measure Type']
              if (type != undefined)
                cur_value = unit_for_value(cur_value, type)
              else{
                checked_measure = $('input:checked', $('#collapseMeasureType'))[0].value;
                cur_value = unit_for_value(cur_value, checked_measure);
              }


              html += "<td class='right_align col-" + col_num + "'>" + cur_value + "</td>";
              col_num++;
            });
          } else {
            cur_value = data['data'][row_index]['data'][0];
            text = cur_value
            if (jQuery.isNumeric(text) == true){
              if (Number(text)===text && text%1 !==0 ) cur_value = parseInt(text).toLocaleString('en-US')
            }


            type = data['data'][row_index]['dims']['Measure Type']
            if (type != undefined)
              cur_value = unit_for_value(cur_value, type)
            else{
              checked_measure = $('input:checked', $('#collapseMeasureType'))[0].value;
              cur_value = unit_for_value(cur_value, checked_measure);
            }

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
  //format_numbers();
  hide_spinner();
});
}

function unit_for_value(value, type){
  isSuppressed = (value == '*' || value == -9999 || value == '-' || value == 'Suppressed')
  if (isSuppressed)
    return value

  if ( units[type] != undefined){
    if (units[type] == '$')
      return '$' + value.toString()
    else
      return value.toString() + units[type]

  }
}

function format_numbers(){
  jQuery.map( $('td'), function( item ) {
      text = $(item).html()
      if (jQuery.isNumeric(text) == true){
        $(item).html(parseInt(text).toLocaleString('en-US'))
      }
    });
}
function change_page_url(link){
  title = $('title').text();
  window.history.pushState(title, title, link);
}
function draw_chart(){
  var dataset_id = $("#dataset_id").val(),
      dataset_title = $("#dataset_title").val(),
      description = $("#profile_info").text(),
      source = $('#Source').text();

  $.ajax({type: "POST",
            url: "/vizualization_data/" + dataset_id,
            data: JSON.stringify({view: display_type,
                                  filters: get_filters(),
                                  omit_single_values: true
                                  }),
            contentType: 'application/json; charset=utf-8'}).done(function(data) {
        change_page_url(data['link']);

        var type = checked_measure = $('input:checked', $('#collapseMeasureType'))[0].value;
        var series = [];
        var legend_series = [];
        var years = data['years'];
        var series_data = data['data'];
        $.each(series_data, function(i){
          if (!series_data[i]['dims'])
            return "This series doesn't exist"
          cur_series_data = series_data[i]['data'];
          $.each(cur_series_data, function(i){
            if (cur_series_data[i] == SUPPRESSED_VALUE) cur_series_data[i] = null;
          });
          cur_series_dims = series_data[i]['dims'];
          cur_series = {};
          cur_legend_series = {};
          cur_series['data'] = cur_series_data;
          cur_legend_series['data'] = cur_series_data;

          delete cur_series_dims['Measure Type'];
          name = "<div id='legendTown'>"+ cur_series_dims['Town'] + "<div id='legendDims'>";
          town_name = name
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
          cur_legend_series['name'] = town_name;
          series.push(cur_series);
          legend_series.push(cur_legend_series);
        });

        if(series.length == 0) {
          hide_spinner();
          return display_error("No results, please select different filters");
        }
        yAxisLabel = $(".MeasureType:checked").first().val();
        if (units[type] != undefined && units[type] != ' ' && units[type] != '')
          yAxisLabel += ' (' + units[type] + ')'

        hide_spinner();
        $('#container').highcharts({
            chart: {
              type: display_type
            },
            title: {
              text: ''
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
            plotOptions: {
                column: {
                    minPointLength: 3
                    }
            },
            legend: {
                layout: 'horizontal',
                verticalAlign: 'bottom',
                borderWidth: 0,
                maxHeight: 200
            },
            tooltip: {
              formatter: function () {
                return '<b>' + this.key + '</b><br>' +
                       this.series.name + '<br>' +
                       'Value: <b>' + unit_for_value(this.y, type) + '</b>';
              }
            },
            credits: {
              text: 'Source: ' + source + '. CTData.org'
            },
            series: series,
            exporting: {
              chartOptions:{
                title: {
                    text: dataset_title,
                    x: -20 //center
                },
                subtitle: {
                    text: description,
                    x: -20 //center
                }
              }
            }
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
  $("#profile_info").text(filter_text);

  $li = $('li#Connecticut')
  $li.prependTo($li.closest('ul')[0]);

}

$(function () {

    select_all();
    deselect_all();
    check_defaults();
    show_headline_popup();
    show_edit_indicators_popup();
    add_ind_id_to_removing_list();
    update_headline_indicators();
    show_selected_indicator();
    $('.filter div.collapse').collapse('hide');
    $('input[type="checkbox"]').change(function(){
        $('#default.head_ind_link').prop('selected', true)
        if ($(this).attr('name') == 'Town'){
          $li = $(this).closest('li')
          $li.prependTo($li.closest('ul'));
        }
        display_data();
    });
    hide_spinner();

    var width = $(window).width() * 0.6;
    $("#container").width(width);
    window.onresize = function() {
      var width = $(window).width() * 0.6;
      $("#container").width(width);
    }
    create_headline_indicator();
    $('.tooltip_a').tooltip();

    var towns_names = []
    $.map( $('li', $('#collapseTown')), function(item){
      towns_names.push( $(item).attr('id'))
    });

    $( "#tags" ).autocomplete({
      source: towns_names,
      select: function (event, ui) {
        var value = ui.item.value;

        $input = $('input[id="' + value + 'Check"]');

        $input.prop('checked', true);
        $input.closest('li').prependTo($li.closest('ul')[0]);
        display_data();

      }
    });

    // move checked checkboxes to the top of their lists
    $.each( $("input:checked", $('div#collapseTown')), function(i, item){
      $li = $(item).closest('li');
      $li.prependTo($li.closest('ul'));
    });

    //move suppression between full description and source
    $('#Suppression').appendTo( $("li[id='Full Description']") )
    $('#Contributor').appendTo( $('#Contributor').closest('ul').find('li').last())
});
