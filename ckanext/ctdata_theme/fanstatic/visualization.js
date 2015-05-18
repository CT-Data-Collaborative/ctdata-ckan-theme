var display_type  =  (location.search.split('v=')[1]||'').split('&')[0] || "table",
    map_filters   = [],
    chart_filters = [],
    table_filters = [],
    dataset_id    = $("#dataset_id").val(),
    create_popup  = $("#create_indicator_popup"),
    edit_popup    = $("#edit_indicators_popup"),
    create_for_gallery_popup    = $("#create_gallery_indicator_popup"),
    checkboxes_except_town = $("input[type='checkbox']:not(." + geography_param + ")"),
    SUPPRESSED_VALUE = -9999,
    needed_view_type = '';

window.ids_to_remove = [];

create_popup.modal({show: false});
edit_popup.modal({show: false});
$('.close_popup').click(function() {
  create_popup.modal('hide');
  edit_popup.modal('hide');
  create_for_gallery_popup.modal('hide')
});

function show_selected_indicator(){
  ind_id = location.search.split('ind=')[1]
  if (ind_id != undefined){
    $('#'+ind_id + '.head_ind_link').prop('selected', true)
  }
}

function show_seleted_filters(){
  filters_hash = collect_filters_hash();
  html_text    = "<ul>"

  Object.keys(filters_hash).forEach(function (key) {
    html_text += "<li><h4>" + key + "</h4><small>" + filters_hash[key].join(', ') + "</small></li>"
  });
  html_text += "</ul>"
  $('.selected_filters').html(
    html_text
  );
}

function show_headline_popup(){
  $('#save_headline_indicator').on('click', function(){
    show_seleted_filters();
    create_popup.modal('show');
  });
}

function show_edit_indicators_popup(){
  $('#edit_headline_indicators').on('click', function(){
    edit_popup.modal('show');
  });
}

function show_create_gallery_indicators_popup(){

  $('#save_indicator_to_gallery').on('click', function(){
    show_seleted_filters();
    create_for_gallery_popup.modal('show');
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
  $('.create_headline_indicator').on('click', function(){
    filters = []
    Object.keys(filters_hash).forEach(function (key) {
      filters.push({field: key, values: filters_hash[key]})
    });

    permission = 'public'
    if ($('input:radio:checked').val() != undefined){
      permission = $('input:radio:checked').val()
    }

    $form = $(this).closest('.modal-content').find('form');

    type = $form.find('.indicator_ind_type').val();
    name = $form.find('.indicator_name').val();
    description = $form.find('.indicator_description').val()
    group_ids = []

    $form.find('input:checked.indicator_group').map(function(){
      group_ids.push($(this).val());
    });

    $('span.ajax_spinner').removeClass('hidden')
    $.ajax({type: "POST",
      url: "/community/add_indicator",
      data: JSON.stringify({ dataset_id: dataset_id, name: name,
                             ind_type: type, filters: filters,
                             permission: permission,
                             description: description,
                             visualization_type: display_type,
                             group_ids: group_ids.join()}),
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

        $input = $("input[class*='"+i.replace(/ /g, '')+"']"+'[value="'+defaults[i][j]+'"]');
        $input.prop('checked', true);
      });
    } else {
        $input = $("input[class*='"+i.replace(/ /g, '')+"']"+'[value="'+defaults[i]+'"]');
        $input.prop('checked', true);
    }
    });
    if (display_type == 'map'){
      set_map_checkbox();
    }else if (display_type == 'column' || display_type == 'line'){
      reset_checkbox();
      set_chart_checkbox();
    }
    display_data();
}

function save_filters(display_type){
  if(display_type == 'table')
    table_filters = get_filters()

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
  if(display_type != 'map' && display_type != 'table' && chart_filters.length > 0){
    filters_to_update = chart_filters;
  }
  if(display_type == 'table' && table_filters.length > 0){
    filters_to_update = table_filters;
  }
  if(filters_to_update.length > 0){
    $.each(filters_to_update, function(i){
      column = filters_to_update[i]
      $.each(column['values'], function(value){
        $("input[class*='"+column['field']+"']"+"[value='"+column['values'][value]+"']").prop('checked', true);
      });
    });
  }
}

function set_display_type(new_type){
  set_icon(new_type);
  save_filters(display_type);
  set_filters(new_type);

  $.each($('option'), function(i){
    $('option')[i].value = $('option')[i].value.replace('v=map',   'v='+ new_type);
    $('option')[i].value = $('option')[i].value.replace('v=table', 'v='+ new_type);
    $('option')[i].value = $('option')[i].value.replace('v=column','v='+ new_type);
    $('option')[i].value = $('option')[i].value.replace('v=line',  'v='+ new_type);
  })

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


function collapse_all(){
  $("div.collapse").collapse('hide');
}

function choose_measure_type_for_charts(){
  measure = $('input:checked', $('#collapseMeasureType'))[0]
  if (measure == undefined){
    $($('input:not(:disabled)', $('#collapseMeasureType'))).prop('checked', true);
  }
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
  choose_measure_type_for_charts();
}

//If showing map, only allow one of each filter to be checked at a time
function set_map_checkbox(){
  checkboxes_except_town.click(function(){
    var val = $(this).prop('checked');
    $(this).parent().parent().find("input[type='checkbox']").prop('checked', false);
    $(this).prop('checked', val);
    display_data();
  });
  checkboxes_except_town.unbind("change");
  //Uncheck all but the first checked for each filter
  filter_lists = $('.filter');
  $.each(filter_lists, function(i){
    $(filter_lists[i]).find("input:checked:not(." + geography_param+ ", .Year)[value != 'Margins of Error']").slice(1).prop('checked', false);
  });

  //Check most recent year
  values = []

  years_inputs = []
  if ($("input:checked.Year").length > 0)
    years_inputs = $("input:checked.Year")
  else
    years_inputs = $("input.Year")

  if (years_inputs.length > 1){
    $(years_inputs).map(function(){
      value = $(this).val()
      if (value.indexOf('-') == -1)
        values.push(parseInt( value ))
      else
        values.push(parseInt( value.split('-')[1] ))
    });
    max_year = Math.max.apply(null, values)
    i = values.indexOf(max_year) || 0

    $("input:checked.Year").prop('checked', false);
    $("input#"+ years_inputs[i].value +"Check.Year").prop('checked', true);
  }
  else{
    years_inputs.prop('checked', true);
  }

  choose_measure_type_for_charts();
}

//When not showing map, allow multiple filters to be checked
function reset_checkbox(){
  checkboxes_except_town.unbind("click");
  checkboxes_except_town.change(function(){
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

    if(disabled.indexOf(new_type) > -1){
      display_error("This visualization is disabled for this dataset");
      hide_spinner();
      return 0;
    }

    towns = $("input." + geography_param + ":checked");
    years = $("input.Year:checked");
    error = ''

    if (display_type == 'map'){
      $('#collapse' + geography_param).find('input').addClass('disabled');
      $('#collapse' + geography_param).find('label').addClass('disabled');
      $('#collapse' + geography_param).find('input').attr("disabled", true);
      $('#collapse' + geography_param).find('label').attr("disabled", true);
      $('input[type="checkbox"][class != "indicator_group"]').addClass('as_radio');
    }
    if (display_type == 'column' || display_type == 'line'){
      $('#collapse' + geography_param).find('input').removeClass('disabled');
      $('#collapse' + geography_param).find('label').removeClass('disabled');
      $('#collapse' + geography_param).find('input').attr("disabled", false);
      $('#collapse' + geography_param).find('label').attr("disabled", false);
      $('input[type="checkbox"][class != "indicator_group"]').removeClass('as_radio')
      $('input[type="checkbox"].MeasureType').addClass('as_radio')
    }
    if (display_type == 'table'){
      $('#collapse' + geography_param).find('input').removeClass('disabled');
      $('#collapse' + geography_param).find('label').removeClass('disabled');
      $('#collapse' + geography_param).find('input').attr("disabled", false);
      $('#collapse' + geography_param).find('label').attr("disabled", false);
      $('input[type="checkbox"][class != "indicator_group"]').removeClass('as_radio')
    }

    if(towns.length == 0 && display_type != 'map'){
      if (window.location.href.indexOf(geography_param) > -1) {
          $.ajax({type: "POST",
              url: "/update_visualization_link/"+dataset_id,
              data: JSON.stringify({view: 'table', filters: get_filters()}),
              contentType: 'application/json; charset=utf-8'}).done(function(data) {
                change_page_url(data.link)

                handle_incompatibilities(data.compatibles)
              });
      }

      hide_spinner();
      error = "Please select a " + geography_param;
    }

    if (years.length == 0){
      if (window.location.href.indexOf("Year") > -1) {
          $.ajax({type: "POST",
              url: "/update_visualization_link/"+dataset_id,
              data: JSON.stringify({view: 'table', filters: get_filters()}),
              contentType: 'application/json; charset=utf-8'}).done(function(data) {
                change_page_url(data.link)

                handle_incompatibilities(data['compatibles'])
              });
      }
      hide_spinner();
      error = "Please select a year";
    }

    ch_variables = $("input.Variable:checked[value != 'Margins of Error']");
    if(ch_variables.length == 0){
      if (window.location.href.indexOf(geography_param) > -1) {
          $.ajax({type: "POST",
              url: "/update_visualization_link/"+dataset_id,
              data: JSON.stringify({view: 'table', filters: get_filters()}),
              contentType: 'application/json; charset=utf-8'}).done(function(data) {
                change_page_url(data.link)

                handle_incompatibilities(data.compatibles)
              });
      }

      hide_spinner();
      error = "Please select a Variable" ;
    }


    if (error != ''){
        $("#container_2").html('');
        $("#container_2").addClass('hidden');
        $("#link_to_second_table").addClass('hidden');
        return display_error(error)
    }

  switch(display_type){
    case "map":
     //Show the print and save icons
      needed_view_type = 'map'
      $(".operations").css("visibility","visible");
      draw_map();
      break;
    case "table":
      //Don't show the print and save icons
      needed_view_type = 'table'
      $(".operations").css("visibility","hidden");
      $('.operations').show();
      draw_table();
      break;
    default:
      //Show the print and save icons
      needed_view_type = 'line_or_chart'
      $(".operations").css("visibility","visible");
      $('.operations').show();
      draw_table();
      draw_chart();
  }

}

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

  all_inputs = $("input[type='checkbox'][class != 'indicator_group']");
  $.each(all_inputs, function(i){
    if($.inArray($(all_inputs[i]).val(), compatibles) != -1){
      $(all_inputs[i]).removeAttr("disabled");
      $(all_inputs[i]).parent().find("label").css("color", "gray");
    }else{
      $(all_inputs[i]).attr("disabled", true);
      $(all_inputs[i]).attr("checked", false);
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
      if (needed_view_type == 'table')
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
          if((data['data'][d]['dims'][dim_name] != "NA" && data['data'][d]['dims'][dim_name] != "All" && dim_name != geography_param)){
            selected_dims[dim_name] = all_dims[dim_name];
          }
          }
        });
      });
      var years = data['years'];
      var col_num = 2;
      var html = '<table id="table" class="table results_table">'+
                 "<thead>"+
                   "<tr class='head'>"+
                     "<th>Location</th>";
                   $.each(selected_dims, function(dim_name){
                     html += "<th>"+dim_name+"</th>";
                     col_num++;
                   });
                 if (years !== undefined) {
                   $.each(years, function (i) {
                       html = html + "<th> <span class='for_year'>" + years[i] + "</span></th>";
                   });
                 } else {
                   html = html + "<th>Value</th>";
                 }
                 html+=  "</tr>"+
                 "</thead>"+
                 "<tbody>";
        $.each(data['data'], function(row_index){
          if (!data['data'][row_index]['dims']) return "No data for this row";
          col_num = 2;
          html += "<tr>"+ "<td>"+data['data'][row_index]['dims'][geography_param]+"</td>";
          $.each(selected_dims, function(dim_name){
               html += "<td>"+data['data'][row_index]['dims'][dim_name]+"</td>";
               col_num++;
          });
          if (years !== undefined) {
            $.each(years, function (year_index) {
              cur_value = data['data'][row_index]['data'][year_index];
              if (!cur_value && cur_value != 0) cur_value = "-";
              if (cur_value == SUPPRESSED_VALUE) cur_value = '*'

              text = cur_value.toString()
              array = text.split('.')

              if (jQuery.isNumeric(text) == true && array.length == 1)
                cur_value = parseInt(text).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              else{
                if (jQuery.isNumeric(text) == true && array.length == 2 && array[0].length > 4){
                  array[0]  = parseInt(array[0]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                  cur_value = array.join('.');
                }
              }

              type = data['data'][row_index]['dims']['Measure Type']
              if (type == undefined && $('input:checked', $('#collapseMeasureType'))[0] != undefined)
                type = $('input:checked', $('#collapseMeasureType'))[0].value

              if (type != undefined)
                cur_value = unit_for_value(cur_value, type)

              if (data['data'][row_index]['moes'].length != 0){
                moes_value = data['data'][row_index]['moes'][year_index]
                if (type != undefined) moes_value = unit_for_value(moes_value, type);
                cur_value += '<span class="moes"> ± ' + moes_value + '</span>'
              }

              html += "<td class='right_align'>" + cur_value + "</td>";
              col_num++;
            });
          } else {
            cur_value = data['data'][row_index]['data'][0];
            text = cur_value
            if (jQuery.isNumeric(text) == true){
              if (Number(text)===text && text%1 !==0 ) cur_value = parseInt(text).toLocaleString('en-US')
            }


            type = data['data'][row_index]['dims']['Measure Type']

            if ($('input:checked', $('#collapseMeasureType'))[0] != undefined){
              type = $('input:checked', $('#collapseMeasureType'))[0].value
            }
            if (type != undefined)
              cur_value = unit_for_value(cur_value, type)

            if (data['data'][row_index]['moes'].length != 0){
              moes_value = data['data'][row_index]['moes'][year_index]
              if (type != undefined) moes_value = unit_for_value(moes_value, type);
              cur_value += '<span class="moes"> ± ' + moes_value + '</span>'
            }


            html += "<td class='col-" + col_num + "'>" + cur_value + "</td>";
          }
        });
     html = html+"</tbody></table>";
      if (needed_view_type == 'line_or_chart'){
        $("#container_2").html(html);
        $("#container_2").removeClass('hidden')
        $("#link_to_second_table").removeClass('hidden')
      }
      else{
        $("#container").html(html);
        $("#container_2").addClass('hidden');
        $("#link_to_second_table").addClass('hidden');
        $("#container_2").html('');

        add_scroll_to_table();

        $("#table").DataTable({
          dom: 'T<"clear">lfrtip',
          tableTools:{
            "sSwfPath": "/common/swf/copy_csv_xls_pdf.swf",
            "aButtons": ["print", "pdf", "csv"]
          }
        });


      }

  hide_spinner();
});
}

function unit_for_value(value, type){
  isSuppressed = (value == '*' || value == -9999 || value == '-' || value == 'Suppressed')
  if (isSuppressed)
    return value

  if (value == null)
    return value

  if ( units[type] != undefined){
    if (units[type] == '$'){
      return '$' + value.toString()
    }
    else{
      if (value || value == 0)
        return value.toString() + units[type]
      else
        return value
    }
  }
  else{
    return value
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
  set_chart_checkbox();
  $.ajax({type: "POST",
            url: "/vizualization_data/" + dataset_id,
            data: JSON.stringify({view: display_type,
                                  filters: get_filters(),
                                  omit_single_values: true
                                  }),
            contentType: 'application/json; charset=utf-8'}).done(function(data) {
        change_page_url(data['link']);
        var checked_measure = $('input:checked', $('#collapseMeasureType'))[0] //|| $('input', $('#collapseMeasureType'))[0]
        var type            = checked_measure.value;
        var series          = [];
        var legend_series   = [];
        var years           = data['years'];
        var series_data     = data['data'];

        $.each(series_data, function(i){
          if (!series_data[i]['dims'])
            return "This series doesn't exist"
          cur_series_data = series_data[i]['data'];
          $.each(cur_series_data, function(i){
            if (cur_series_data[i] == SUPPRESSED_VALUE) cur_series_data[i] = null;
          });
          cur_series_dims    = series_data[i]['dims'];
          cur_series         = {};
          cur_legend_series  = {};
          cur_series['data'] = cur_series_data;
          cur_legend_series['data'] = cur_series_data;

          delete cur_series_dims['Measure Type'];
          name = "<div id='legendTown'>"+ cur_series_dims[geography_param] + "<div id='legendDims'>";
          town_name = name
          delete cur_series_dims[geography_param];
          var first_flag = 0;
          town = cur_series_dims
          $.each(cur_series_dims, function(dim_index){
            if (cur_series_dims[dim_index] == "NA")
              return "No value for this dimension"
            name += ',' + cur_series_dims[dim_index];
          });

          name += "</div>";
          cur_series['name'] = name;
          cur_series['type'] = display_type;
          cur_legend_series['name'] = town_name;
          series.push(cur_series);

          if (series_data[i]['moes'].length != 0){
            cur_series_erorrs =  jQuery.extend({},cur_series);

            cur_series_erorrs['data'] = []
            $.each(cur_series_data, function(j){
              low  = parseInt(cur_series_data[j]) - parseInt(series_data[i]['moes'][j])
              high = parseInt(cur_series_data[j]) + parseInt(series_data[i]['moes'][j])
              cur_series_erorrs['data'].push([low, high]);
            });

            cur_series_erorrs['type'] = 'errorbar';
            cur_series_erorrs['name'] = town_name + ' error';
            cur_series_erorrs.stemWidth = 2;
            cur_series_erorrs.color = '#FF0000';
            series.push(cur_series_erorrs);
          }

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
            chart: { backgroundColor:'transparent' },
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
                title: {text: yAxisLabel},
                floor: 0,
                minRange: 0.1
            },
            plotOptions: {
              line: {
                  dataLabels: {
                    enabled: true,
                    useHTML: true,
                    formatter: function () {
                      return '<span class="column_value"><em>' + unit_for_value(this.y, type) + '</span></em>'
                    }
                  }
              },
              column: {
                  dataLabels: {
                    enabled: true,
                    useHTML: true,
                    formatter: function () {
                      return '<span class="column_value"><em>' + unit_for_value(this.y, type) + '</span></em>'
                    }
                  }
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
                if (this.series.linkedSeries.length > 0){
                  return '<b>' + this.key + '</b><br>' +
                       this.series.name + '<br>' +
                       'Value: <b>' + unit_for_value(this.y, type) + '</b>' + '<br/>' +
                       'Error range: ' + unit_for_value(this.series.linkedSeries[0]['data'][0].low, type) + ' - ' +
                       unit_for_value(this.series.linkedSeries[0]['data'][0].high, type);
                } else{
                   return '<b>' + this.key + '</b><br>' +
                       this.series.name + '<br>' +
                       'Value: <b>' + unit_for_value(this.y, type) + '</b>' + '<br/>';

                }
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
    if (filters[i]['field'] == geography_param) return "Skip town";
    filter_text += filters[i]['field']+": "+filters[i]['values'] + " | ";
  });
  filter_text = filter_text.replace('Select AllDeselect All', '').substring(0, filter_text.length - 2);
  $("#profile_info").text(filter_text);

  $li = $('li#Connecticut')
  $li.prependTo($li.closest('ul')[0]);

}

function hide_or_show_clear_link(){
  if ($('input[type="checkbox"][class != "indicator_group"]:checked').length > 0)
    $('span.clear').show();
  else
    $('span.clear').hide();
}

function clear_all(){
  $('.clear_all').on('click', function(){
    $('input[type="checkbox"][class != "indicator_group"]:checked').prop('checked', false);
    $('span.clear').hide();
    display_data();
  });
}

function add_scroll_to_table(){
  $('tr[class!=head]').each(function(j){
    $tr = $($('tr[class!=head]')[j])
    $tr.find('td').each(function(i){
      text       = $($tr.find('td')[i]).text()

      $('span#string_span').html(text)
      text_width = $('span#string_span').width()


      if (text_width > 60){
        th = $('tr.head').find('th')[i]
        if (text_width > $(th).width()){
          $(th).width(text_width + 40)
        }
      }
      else
        $($('tr.head').find('th')[i]).width(100)

      $('span#string_span').html('')
    })

  })
}
$(function () {
    select_all();
    deselect_all();
    check_defaults();
    show_headline_popup();
    show_edit_indicators_popup();
    show_create_gallery_indicators_popup();
    add_ind_id_to_removing_list();
    update_headline_indicators();
    show_selected_indicator();
    hide_or_show_clear_link();
    clear_all();
    $('li.filter').on('mouseover', function(){
      $(this).next('span.more_copy').removeClass('hidden_visibility')
    });

    $('li.filter').on('mouseout', function(){
      $(this).next('span.more_copy').addClass('hidden_visibility')
    });

    $('.show_dataset_info').tooltip();
    $('.filter div.collapse').collapse('hide');
    $('input[type="checkbox"][class != "indicator_group"]').change(function(){
        $('#default.head_ind_link').prop('selected', true)
        if ($(this).attr('name') == geography_param){
          $li = $(this).closest('li')
          $li.prependTo($li.closest('ul'));
        }
        hide_or_show_clear_link();
        is_checked = $(this).prop('checked')
        if (display_type == 'map'){
          $ul = $(this).closest('li').closest('ul')
          $ul.find('input[value != "Margins of Error"]').prop('checked', false)
          $(this).prop('checked', is_checked)
        }
        display_data();
    });
    hide_spinner();

    var width = $(window).width() * 0.6;
    $("#container").width(width);
    $("#container_2").width(width);
    $("a.togglebtn", $('.results_table')).width(width);
    $("#second_table").width(width + 60);
    $("#metadata").width(width);
    $("#collapseMetadata").width(width + 50);
    window.onresize = function() {
      var width = $(window).width() * 0.6;
      $("#container").width(width);
      $("#container_2").width(width);
      $("a.togglebtn", $('.results_table')).width(width);
      $("#second_table").width(width + 50);
      $("#metadata").width(width);
      $("#collapseMetadata").width(width+50);
    }
    create_headline_indicator();
    $('.tooltipsecond_table_a').tooltip();
    $('.show_dataset_info').tooltip();

    var towns_names = []
    $.map( $('li', $('#collapse' + geography_param)), function(item){
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
    $.each( $("input:checked", $('div#collapse' + geography_param)), function(i, item){
      $li = $(item).closest('li');
      $li.prependTo($li.closest('ul'));
    });

    //move suppression between full description and source
    $('#Suppression').appendTo( $("li[id='Full Description']") )
    $('#Contributor').appendTo( $('#Contributor').closest('ul').find('li').last())

    $('input.indicator_permission').on('change', function(){
      if ($('input.private_permission:checked').length > 0 ){
        $('input.indicator_group:checked').prop('checked', false);
        $('.groups_inputs').addClass('hidden')
      }
      else{
        $('.groups_inputs').removeClass('hidden')
      }
    });

    $('#collapseMetadata').collapse()

    $('a[href="#collapseMetadata"]').on('click', function(){

      i_minus = $(this).find('i.fa-minus')
      i_plus  = $(this).find('i.fa-plus')
      i_minus.removeClass('fa-minus').addClass('fa-plus')
      i_plus.removeClass('fa-plus').addClass('fa-minus')
    })

    $('a[href="#second_table"]').on('click', function(){
      i_minus = $(this).find('i.fa-minus')
      i_plus  = $(this).find('i.fa-plus')
      i_minus.removeClass('fa-minus').addClass('fa-plus')
      i_plus.removeClass('fa-plus').addClass('fa-minus')
    })

  $('#only_chart_image').addClass('hidden')
  $('#chart_image').addClass('hidden')
});
