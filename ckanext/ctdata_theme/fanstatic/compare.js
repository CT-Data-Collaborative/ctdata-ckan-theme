var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {},
    x_axe_name           = "",
    y_axe_name           = "",
    main_geo_type        = "",
    mark_type            = "symbol",
    color                = '',
    shape                = '',
    size                 = '';
    comparable           = []

function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

function draw_graph(){
  $('#container').html('');
  var spec = {
    "width": 450,
    "height": 250,
    // "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},
    "data": [{"name": "table"}],
    "scales": [
      {
        "name": "x", "type": "ordinal", "range": "width",
        "domain": {"data": "table", "field": "data.x"}
      },
      {
        "name": "y", "range": "height", "nice": true,
        "domain": {"data": "table", "field": "data.y"}
      }
    ],
    "axes": [
      {"type": "x", "scale": "x", "offset": 1, "ticks": 5, "title": x_axe_name},
      {"type": "y", "scale": "y", "offset": 1, "ticks": 5, "title": y_axe_name}
    ],
    "marks": [
      {
        "type": mark_type,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": "data.x"},
            "y": {"scale": "y", "field": "data.y"},
            "y2": {"scale": "y", "value": 0},
            "width": {"scale": "x", "band": true, "offset": -1}
          },
          "update": {
            "fill": {"value": "steelblue"}
          },
          "hover": {
            "fill": {"value": "green"}
          }
        }
      },
      {
        "type": mark_type,
        "interactive": false,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": "data.x", "offset": 0},
            "y": {"scale": "y", "field": "data.y", "offset": 0},
            "y2": {"scale": "y", "value": 0, "offset": 3.5},
            "width": {"scale": "x", "band": true, "offset": 6},
            "fill": {"value": "transparent"},
            "stroke": {"value": "green"},
            "strokeWidth": {"value": 2}
          },
          "update": {
            "strokeOpacity": {"value": 0}
          },
          "hover": {
            "strokeOpacity": {"value": 1}
          }
        }
      }
    ]
  };

  var data = {table: [
    {"x": 1,  "y": 28}, {"x": 2,  "y": 55},
    {"x": 3,  "y": 43}, {"x": 4,  "y": 91},
    {"x": 5,  "y": 81}, {"x": 6,  "y": 53},
    {"x": 7,  "y": 19}, {"x": 8,  "y": 87},
    {"x": 9,  "y": 52}, {"x": 10, "y": 48},
    {"x": 11, "y": 24}, {"x": 12, "y": 49},
    {"x": 13, "y": 87}, {"x": 14, "y": 66},
    {"x": 15, "y": 17}, {"x": 16, "y": 27},
    {"x": 17, "y": 68}, {"x": 18, "y": 16},
    {"x": 19, "y": 49}, {"x": 20, "y": 75}
  ]};


  vg.parse.spec(spec, function(chart) {
    var view = chart({el:"#container", data:data})
      .on("mouseover", function(event, item) {
        // invoke hover properties on cousin one hop forward in scenegraph
        view.update({
          props: "hover",
          items: item.cousin(1)
        });
      })
      .on("mouseout", function(event, item) {
        // reset cousin item, using animated transition
        view.update({
          props: "update",
          items: item.cousin(1),
          duration: 250,
          ease: "linear"
        });
      })
      .update();
  });

}

function get_data(){
  $.ajax({type: "POST",
    url: "/compare/join_for_two_datasets/",
    data: JSON.stringify({ main_dataset: $main_dataset_select.val(), compare_with: $compare_with_select.val(), filters: get_filters()}),
    contentType: 'application/json; charset=utf-8',
    success: function (data) {
      debugger
    }
  });

}
function addScale(name){
  $("#matches ul").append('<li class="scale_variant">' + name + '<a href="javascript:void" class="cancel-drag pull-right icon-remove hidden" ></a></li>')
}

function show_matches_in_popup(dataset_matches){
  $.each(dataset_matches, function(i, item){
    key = Object.keys(item)[0]
    without_spaces = key.replace(/\s/g, '-')
    addScale(key)
    $("ul.common_dimensions").append('<li class="common_li"> <h4>' + key + '</h4><ul class="common_li_ul '+ without_spaces +'"></ul></li>')
    $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
    $.each(item[key], function(j, value){
      $('ul[class="common_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ without_spaces+ '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function show_non_matches_for_main_dataset_in_popup(main_no_matches){
  $.each(main_no_matches, function(i, item){
    key = Object.keys(item)[0]
    without_spaces = key.replace(/\s/g, '-')
    $("ul#main.left_dimensions").append('<li class="main_li"> <h4>' + key + '</h4><ul class="main_li_ul '+ without_spaces +'"></ul></li>')

    $.each(item[key], function(j, value){
      $('ul[class="main_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ without_spaces+ '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function show_non_matches_for_comapre_dataset_in_popup(no_matches){
  $.each(no_matches, function(i, item){
    key = Object.keys(item)[0]
    without_spaces = key.replace(/\s/g, '-')
    $("ul#compare.left_dimensions").append('<li class="compare_li"> <h4>' + key + '</h4><ul class="compare_li_ul '+ without_spaces +'"></ul></li>')

    $.each(item[key], function(j, value){
      $('ul[class="compare_li_ul '+ without_spaces + '"]').append('<li class="dim_value"><label><input type="radio" name="'+ without_spaces+ '"value="' + value + '">'+value+'</lablel></li>')
    })
  });
}

function check_first_inputs(){
  $('.common_li_ul').each(function(i){
    $($('.common_li_ul')[i]).find('input').first().attr('checked', true)
    $($('.main_li_ul')[i]).find('input').first().attr('checked', true)
    $($('.compare_li_ul')[i]).find('input').first().attr('checked', true)
  })
}

function get_filters() {
  return $('ul').find('input:checked').map(function(i, e) {
      return {field: $(e).attr('name'), values: [$(e).val()]}
  }).get();
}


$(document).ready(function(){
  close_popup()

  $main_dataset_select.on('change', function(){
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
          x_axe_name = $(ui.draggable).text(); break;
        case "y":
          y_axe_name = $(ui.draggable).text(); break;
        case "color":
          color = $(ui.draggable).text(); break;
        case "size":
          size  = $(ui.draggable).text(); break;
        case "shape":
          shape = $(ui.draggable).text(); break;
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
    $(this).closest('li').closest('div').removeClass('dropped')
    $("#matches ul").append($li )
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

    compare_dataset_data = comparable.filter(function( item) {
                          if (item['dataset_name'] == $("select#compare_with").val())
                            return item
                        })[0]

    addScale(main_geo_type)
    show_matches_in_popup(matches[$(this).val()])
    show_non_matches_for_main_dataset_in_popup(compare_dataset_data.main_no_matches)
    show_non_matches_for_comapre_dataset_in_popup(compare_dataset_data.no_matches)

    check_first_inputs()
    $('#select_uniq_values_popup').modal('show');
  });

  $('#continue_button').on('click', function(){
    get_data();
  })

  draw_graph();

  $('.update-filters').on('click', function(){
    $('#select_uniq_values_popup').modal('show');
  })

})
