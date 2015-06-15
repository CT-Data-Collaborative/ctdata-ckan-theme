var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {},
    x_axe_name           = "Value"
    y_axe_name           = "",
    main_geo_type        = "",
    mark_type            = "symbol",
    color                = 'data.Variable',
    shape                = 'data.shape',
    size                 = 'data.size',
    min                  = 0,
    max                  = 200000,
    x_dim                = "",
    y_dim                = "",
    default_color        = 'blue',
    default_size         = 50,
    variable_1           = '',
    variable_2           = '',
    comparable           = [],
    data_items           = [];

function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

function draw_graph(){
  $('#container').html('');
  x_axe_type = ( x_axe_name != main_geo_type ? "linear" : "ordinal");
  y_axe_type = ( y_axe_name != main_geo_type ? "linear" : "ordinal");

  height     = ( y_axe_name == main_geo_type  ?  count_uniq_values_for(y_axe_name) * 10 : 500);
  width      = ( x_axe_name == main_geo_type  ?  count_uniq_values_for(x_axe_name) * 10 : 600);

  var spec = {
    "width": width,
    "height": height,
    "data": [{"name": "table"}],
    "viewport": [900, 700],
    "scales": [
      {
        "name": "x", "type": x_axe_type, "range": "width", "nice": true ,"sort": true, //, "domainMin": min, "domainMax": max,
        "domain": {"data": "table", "field": x_dim}
      },
      {
        "name": "y", "type": y_axe_type, "range": "height", "nice": true, "sort": true,
        "domain": {"data": "table", "field": y_dim}
      },
      {
        "name": "c",
        "type": "ordinal",
        "domain": {"data": "table", "field": color},
        "range": ["#4670A7", "#080","#B63535", '#E8D619', '#19E85B', '#BE2287', '#BE2251','#6C6164','#9419E8','#C84130', '#B9C830']
      },
      {
        "name": "d",
        "type": "ordinal",
        "domain": {"data": "table", "field": size},
        "range": [50, 100, 150, 200, 250, 300]
      },
      {
        "name": "e",
        "type": "ordinal",
        "domain": {"data": "table", "field": shape},
        "range": ['circle', 'square', 'cross', 'diamond', 'triangle-up', 'triangle-down']
      }
    ],
    "axes": [
      { "type": "x", "scale": "x", "orient": "top", "offset": 0, "grid": true, "sort": true,
        "layer": "back", "titleOffset": 50, "ticks": 25, "title": '',
        "properties": {
           "ticks": {
             "stroke": {"value": "#000"}
           },
           "majorTicks": {
             "strokeWidth": {"value": 1}
           },
           "labels": {
             "fill": {"value": "#000"},
             "angle": {"value": -40},
             "fontSize": {"value": 10},
             "align": {"value": "left"},
             "baseline": {"value": "middle"},
             "dx": {"value": 1},
             "dy": {"value": -10}
           },
           "title": {
             "fontSize": {"value": 12},
             "dy": {"value": 5}
           },
           "axis": {
             "stroke": {"value": "#000"},
             "strokeWidth": {"value": 1}
           }
         }
      },
      {"type": "y", "scale": "y", "grid": true, "title": '', "ticks": 25, "layer": "back", "offset": 0,
        "properties": {
           "ticks": {
             "stroke": {"value": "#000"}
           },
           "majorTicks": {
             "strokeWidth": {"value": 1}
           },
           "labels": {
             "fill": {"value": "#000"},
             "fontSize": {"value": 9},
             "align": {"value": "right"},
             "baseline": {"value": "middle"},
             "dy": {"value": 0}
             // "dx": {"value": -70}
           },
           "title": {
             "fontSize": {"value": 12},
           },
           "axis": {
             "stroke": {"value": "#000"},
             "strokeWidth": {"value": 1}
           }
         }
      }
    ],
    "legends": [
      {
        "fill": "c",
        "title": 'Color',
        "offset": 0,
        "properties": {
          "symbols": {
            "fillOpacity": {"value": 0.8},
            "stroke": {"value": "transparent"}
          },
          "legend": {
              "x": {"value": -50},
              "y": {"value": -100},
            }
        }
      },
      {
        "size": "d",
        "title": 'Size',
        "offset": 0,
        "properties": {
          "legend": {
              "x": {"value": 200},
              "y": {"value": -100},
            }
        }
      },
      {
        "shape": "e",
        "title": 'Shape',
        "offset": 0,
        "properties": {
          "legend": {
              "x": {"value": 350},
              "y": {"value": -100},
            }
        }
      }
    ],
    "marks": [
      {
        "type": mark_type,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": x_dim },
            "y": {"scale": "y", "field": y_dim},
            "stroke": {"scale": "c", "field": color},
            "fill": {"scale": "c", "field": color},
            "fillOpacity": {"value": 0.2},
            "size": {"scale": "d", "field": size},
            "shape": {"scale": "e", "field": shape},
          },
          "update": {
            "size": {"scale": "d", "field": size},
          },
          "hover": {
            "size": {"value": default_size * 6},
          }
        }
      },
      // {
      //   "type": 'text',
      //   "from": {"data": "table"},
      //   "properties": {
      //     "enter": {
      //       "x": {"scale": "x", "field": x_dim },
      //       "y": {"scale": "y", "field": y_dim},
      //       "fill": {"value": "#000"},
      //       "fillOpacity": {"value": 0},
      //       "dy": {"value": -20},
      //       "dx": {"value": -13},
      //       "fontWeight": {"value": 900},
      //       "fontSize": {"value": 10},
      //       "text": {"field": "data.label"},
      //     },
      //     "update": {
      //       // "fillOpacity": {"value": 0},
      //       "size": {"value": 300}
      //     },
      //     "hover": {
      //       "size": {"value": 300},
      //       // "fillOpacity": {"value": 1}
      //     }
      //   }
      // },
      {
        "type": mark_type,
        "interactive": false,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": x_dim, "offset": 0},
            "y": {"scale": "y", "field": y_dim, "offset": 0},
            "fill": {"value": "transparent"},
            "strokeWidth": {"value": 2},
            "shape": {"scale": "e", "field": shape},
          },
            "update": {
            "size": {"scale": "d", "field": size}
          },
            "hover": {
            "size": {"scale": "d", "field": size}
          }
        }
      }
    ]
  };

  var data = {table: data_items};

  vg.parse.spec(spec, function(chart) {
    var view = chart({el:"#container", data:data})
      .on("mouseover", function(event, item) {
        // invoke hover properties on cousin one hop forward in scenegraph

        view.update({
          props: "hover",
          items: item.cousin(1)
        });
        $('#info .location').text(item.cousin(1).datum.data.location_name)
        $('#info .variable_1').text(variable_1 + ': ')
        $('#info .variable_2').text(variable_2 + ': ')
        $('#info .variable_1_value').text(item.cousin(1).datum.data[variable_1])
        $('#info .variable_2_value').text(item.cousin(1).datum.data[variable_2])
      })
      .on("mouseout", function(event, item) {
        // reset cousin item, using animated transition
        $('#info .location').text('')
        $('#info .variable_1').text('')
        $('#info .variable_2').text('')
        $('#info .variable_1_value').text('')
        $('#info .variable_2_value').text('')
        view.update({
          props: "update",
          items: item.cousin(1),
          duration: 500,
          ease: "linear"
        });
      })
      .update();
  });

}

function count_uniq_values_for(key){
    ar = []
    $.each(data_items, function(i, el){ if (ar.indexOf(el[key]) == -1) ar.push(el[key]) })
    return ar.length
}

function get_data(){
  $.ajax({type: "POST",
    url: "/compare/join_for_two_datasets/",
    data: JSON.stringify({ main_dataset: $main_dataset_select.val(), compare_with: $compare_with_select.val(), filters: get_filters(), matches: matches[$("select#compare_with").val()] }),
    contentType: 'application/json; charset=utf-8',
    success: function (data) {
      data_items = JSON.parse(data).data
      if (data_items.length > 0){
          // addScale(variable_2)
          y_axe_name = variable_1
          x_axe_name = variable_2
          y_dim      = 'data.' + variable_2
          x_dim      = 'data.' + variable_1

          dragToDroppable('y', variable_1)
          dragToDroppable('x', variable_2)

          $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
          draw_graph();
          $('#select_uniq_values_popup').modal('hide');

      }else{
        $('#container').html('<div id="error">There is no available data to show. </div>')
        $('#select_uniq_values_popup').modal('hide');
      }
    }
  });

}
function addScale(name){
  $("#matches ul").append('<li class="scale_variant">' + name + '<a href="javascript:void" class="cancel-drag pull-right icon-remove hidden" ></a></li>')
}

function show_matches_in_popup(dataset_matches){
  $.each(dataset_matches, function(i, item){
    key = Object.keys(item)[0]
    if (key != 'Variable'){
        without_spaces = key.replace(/\s/g, '-')
        addScale(key)
        $("ul.common_dimensions").append('<li class="common_li"> <h4>' + key + '</h4><ul class="common_li_ul '+ without_spaces +'"></ul></li>')
        $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
        $.each(item[key], function(j, value){
          $('ul[class="common_li_ul '+ without_spaces + '"]').append(
            '<li class="dim_value"><label><input type="checkbox" name="'+ without_spaces+ '"value="' + value + '">'+value+'</lablel></li>'
            )
        })
    }
  });
}

function show_non_matches_for_main_dataset_in_popup(main_no_matches){
  $.each(main_no_matches, function(i, item){
    key = Object.keys(item)[0]
    id  = $main_dataset_select.val()
    without_spaces = key.replace(/\s/g, '-')
    $("ul#main.left_dimensions").append('<li class="main_li"> <h4>' + key + '</h4><ul id="" class="main_li_ul '+ without_spaces +'"></ul></li>')

    $.each(item[key], function(j, value){
        if (value != 'Margins of Error')
            $('ul[class="main_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ id +'_' + without_spaces+ '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function show_non_matches_for_comapre_dataset_in_popup(no_matches){
  $.each(no_matches, function(i, item){
    key = Object.keys(item)[0]
    id = $compare_with_select.val()
    without_spaces = key.replace(/\s/g, '-')
    $("ul#compare.left_dimensions").append('<li class="compare_li"> <h4>' + key + '</h4><ul class="compare_li_ul '+ without_spaces +'"></ul></li>')

    $.each(item[key], function(j, value){
        if (value != 'Margins of Error')
            $('ul[class="compare_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ id +'_' + without_spaces+  '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function check_first_inputs(){
    $('.common_li_ul').each(function(i, el){
      $(el).find('input').first().attr('checked', true)
    });
    $('.main_li_ul').each(function(i, el){
      $(el).find('input').first().attr('checked', true)
    });
    $('.compare_li_ul').each(function(i, el){
      $(el).find('input').first().attr('checked', true)
    });
}

function get_filters() {
  var filters = [];
  dimensions = $("li.common_li, li.main_li, li.compare_li")

  $.each(dimensions, function(i){
    var cur_dim      = $(dimensions[i]);
    var cur_dim_name = cur_dim.find('h4').text()
    var cur_filter   = {'field': cur_dim_name, 'values': []};
    var checked      = cur_dim.find("input:checked")

    if ( cur_dim_name == 'Variable'){
      if (variable_1 == "")
        variable_1 = checked[0].value
      else
        variable_2 = checked[0].value
    }

    $.each(checked, function(option){
      cur_filter['values'].push(checked[option].value);
    });

    if(checked.length != 0)
      filters.push(cur_filter);
  });

  return filters;

}

function  dragToDroppable(id, value){
    $('.droppable#' + id).html(
        '<li class="scale_variant ui-draggable ui-draggable-handle" style="top: 0px; left: 0px;">'+ value +'<a href="javascript:void" class="cancel-drag pull-right icon-remove"></a>'
    )
}

function load_comparable_datasets(dataset_name){
  $.ajax({type: "GET",
      url: "/compare/load_comparable_datasets/" + dataset_name,
      success: function (data) {
        data = JSON.parse(data)
        $('#datasets_to_compare_with').html('')
        $('#datasets_to_compare_with').html($(data.html));
        $compare_with_select = $("select#compare_with")
        matches              = data.matches
        main_geo_type        = data.main_geo_type
        // y_axe_name           = data.main_geo_type
        comparable           = data.comparable
        $('.spinner').hide()
      }
  });
}

$(document).ready(function(){
  close_popup()

  $main_dataset_select.on('change', function(){
    $('.spinner').show()
    $('#datasets_to_compare_with').html('')
    load_comparable_datasets( $(this).val() )
  });

  $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
  $('.droppable').droppable({
    accept: ".scale_variant",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active",
    drop: function( event, ui ) {
      $(this).addClass( "dropped" )
      ui.draggable.find('a').removeClass('hidden')

      switch($(this).attr('id')) {
        case "x":
          x_axe_name = $(ui.draggable).text();
          x_dim      = "data." + $(ui.draggable).text(); break;
        case "y":
          y_axe_name = $(ui.draggable).text();
          y_dim      = "data." + $(ui.draggable).text(); break;
        case "color_s":
          color = "data." + $(ui.draggable).text(); break;
        case "size_s":
          size  = "data." + $(ui.draggable).text(); break;
        case "shape_s":
          shape = "data." + $(ui.draggable).text(); break;
      }
      $(ui.draggable).detach().css({top: 0,left: 0}).appendTo(this);

      draw_graph();
    }
  });

  $('#change_mark_type').on('change', function(){
    mark_type = $(this).val();
    draw_graph();
  });

  $(document).on('click', '.cancel-drag', function(){
    $li = $(this).closest('li')
    $li.find('a').addClass('hidden')

    id = $(this).closest('li').closest('div').attr('id');

    switch(id) {
        case "x":
          x_axe_name = 'x'
          x_dim      = 'data.y'; break;
        case "y":
          y_axe_name = 'y';
          y_dim      = 'data.y'; break;
        case "color_s":
          color = 'data.color'; break;
        case "size_s":
          size  = 'data.size'; break;
        case "shape_s":
          shape = 'data.shape'; break;
    }

    $("#matches ul").append($li )
    $(this).closest('li').closest('div').removeClass('dropped')
    draw_graph();
  })

  $(document).on('change', "select#compare_with" , function(){
    $('#dataset_name_val').text( $main_dataset_select.val().toTitleCase() )
    $('#compare_with_val').text( $(this).val().toTitleCase() )
    $("#matches ul").html('');
    $("ul.common_dimensions").html('');
    $('#main_dataset_dimensions').html('<ul class="left_dimensions" id="main"></ul>')
    $('#compare_dataset_dimensions').html('<ul class="left_dimensions" id="compare"></ul>')
    $('#main_dataset_dimensions').prepend('<h3>' + $main_dataset_select.val().toTitleCase() + '</h3>')
    $('#compare_dataset_dimensions').prepend('<h3>' + $(this).val().toTitleCase() + '</h3>')
    $('.update-filters').removeClass('hidden')

    compare_dataset_data =  comparable.filter(function( item) {
                                if (item['dataset_name'] == $("select#compare_with").val())
                                    return item
                            })[0]

    show_matches_in_popup(matches[$(this).val()])
    show_non_matches_for_main_dataset_in_popup(compare_dataset_data.main_no_matches)
    show_non_matches_for_comapre_dataset_in_popup(compare_dataset_data.no_matches)

    $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
    addScale(main_geo_type)
    check_first_inputs()
    $('#select_uniq_values_popup').modal('show');
  });

  $('#continue_button').on('click', function(){
    get_data();
  })

  // draw_graph();

  $('.update-filters').on('click', function(){
    $('#select_uniq_values_popup').modal('show');
  })

})
