var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {},
    x_axe_name           = "Value"
    y_axe_name           = ""
    main_geo_type        = "",
    mark_type            = "symbol",
    color                = '',
    shape                = '',
    size                 = '',
    min                  = 0,
    max                  = 200000,
    comparable           = [];
    // data_items           = [];

var data_items = JSON.parse(
  '{"data": [{"variable": "Workers 16 years and over", "location_name": "Andover", "fips": 901301080, "value": "1647", "x": 0}, {"variable": "Workers 16 years and over", "location_name": "Ansonia", "fips": 900901220, "value": "8170", "x": 1}, {"variable": "Workers 16 years and over", "location_name": "Ashford", "fips": 901501430, "value": "1873", "x": 2}, {"variable": "Workers 16 years and over", "location_name": "Avon", "fips": 900302060, "value": "6627", "x": 3}, {"variable": "Workers 16 years and over", "location_name": "Barkhamsted", "fips": 900502760, "value": "2045", "x": 4}, {"variable": "Workers 16 years and over", "location_name": "Beacon Falls", "fips": 900903250, "value": "2839", "x": 5}, {"variable": "Workers 16 years and over", "location_name": "Berlin", "fips": 900304300, "value": "9223", "x": 6}, {"variable": "Workers 16 years and over", "location_name": "Bethany", "fips": 900904580, "value": "2548", "x": 7}, {"variable": "Workers 16 years and over", "location_name": "Bethel", "fips": 900104720, "value": "7648", "x": 8}, {"variable": "Workers 16 years and over", "location_name": "Bethlehem", "fips": 900504930, "value": "1617", "x": 9}, {"variable": "Workers 16 years and over", "location_name": "Bloomfield", "fips": 900305910, "value": "8261", "x": 10}, {"variable": "Workers 16 years and over", "location_name": "Bolton", "fips": 901306260, "value": "2531", "x": 11}, {"variable": "Workers 16 years and over", "location_name": "Bozrah", "fips": 901106820, "value": "1300", "x": 12}, {"variable": "Workers 16 years and over", "location_name": "Branford", "fips": 900907310, "value": "12057", "x": 13}, {"variable": "Workers 16 years and over", "location_name": "Bridgeport", "fips": 900108070, "value": "41591", "x": 14}, {"variable": "Workers 16 years and over", "location_name": "Bridgewater", "fips": 900508210, "value": "742", "x": 15}, {"variable": "Workers 16 years and over", "location_name": "Bristol", "fips": 900308490, "value": "26341", "x": 16}, {"variable": "Workers 16 years and over", "location_name": "Brookfield", "fips": 900108980, "value": "7102", "x": 17}, {"variable": "Workers 16 years and over", "location_name": "Brooklyn", "fips": 901509190, "value": "2993", "x": 18}, {"variable": "Workers 16 years and over", "location_name": "Burlington", "fips": 900310100, "value": "4085", "x": 19}, {"variable": "Population 25 years and over", "location_name": "Andover", "fips": 901301080, "value": "85.0", "x": 0}, {"variable": "Population 25 years and over", "location_name": "Ansonia", "fips": 900901220, "value": "609.0", "x": 1}, {"variable": "Population 25 years and over", "location_name": "Ashford", "fips": 901501430, "value": "94.0", "x": 2}, {"variable": "Population 25 years and over", "location_name": "Avon", "fips": 900302060, "value": "175.0", "x": 3}, {"variable": "Population 25 years and over", "location_name": "Barkhamsted", "fips": 900502760, "value": "127.0", "x": 4}, {"variable": "Population 25 years and over", "location_name": "Beacon Falls", "fips": 900903250, "value": "125.0", "x": 5}, {"variable": "Population 25 years and over", "location_name": "Berlin", "fips": 900304300, "value": "491.0", "x": 6}, {"variable": "Population 25 years and over", "location_name": "Bethany", "fips": 900904580, "value": "38.0", "x": 7}, {"variable": "Population 25 years and over", "location_name": "Bethel", "fips": 900104720, "value": "427.0", "x": 8}, {"variable": "Population 25 years and over", "location_name": "Bethlehem", "fips": 900504930, "value": "46.0", "x": 9}, {"variable": "Population 25 years and over", "location_name": "Bloomfield", "fips": 900305910, "value": "232.0", "x": 10}, {"variable": "Population 25 years and over", "location_name": "Bolton", "fips": 901306260, "value": "148.0", "x": 11}, {"variable": "Population 25 years and over", "location_name": "Bozrah", "fips": 901106820, "value": "34.0", "x": 12}, {"variable": "Population 25 years and over", "location_name": "Branford", "fips": 900907310, "value": "700.0", "x": 13}, {"variable": "Population 25 years and over", "location_name": "Bridgeport", "fips": 900108070, "value": "5845.0", "x": 14}, {"variable": "Population 25 years and over", "location_name": "Bridgewater", "fips": 900508210, "value": "22.0", "x": 15}, {"variable": "Population 25 years and over", "location_name": "Bristol", "fips": 900308490, "value": "2406.0", "x": 16}, {"variable": "Population 25 years and over", "location_name": "Brookfield", "fips": 900108980, "value": "190.0", "x": 17}, {"variable": "Population 25 years and over", "location_name": "Brooklyn", "fips": 901509190, "value": "407.0", "x": 18}, {"variable": "Population 25 years and over", "location_name": "Burlington", "fips": 900310100, "value": "156.0", "x": 19}], "success": true}'
  ).data


function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

function draw_graph(){
  $('#container').html('');
  var spec = {
    "width": 700,
    "height": 300,
    // "padding": {"top": 100, "left": 100, "bottom": 300, "right": 100},
    "data": [{"name": "table"}],
    "scales": [
      {
        "name": "x", "type": "ordinal", "range": "width", "domainMin": min, "domainMax": max,
        "domain": {"data": "table", "field": "data.value" }
      },
      {
        "name": "y", "type": "ordinal", "range": "height", //"domainMin": min, "domainMax": max,
        "domain": {"data": "table", "field": "data.location_name"}
      },
      {
        "name": "c",
        "type": "ordinal",
        "domain": {"data": "table", "field": "data.variable"},
        "range": ["#800", "#080"]
      }
    ],
    "axes": [
      {"type": "x", "scale": "x", "offset": 1, "title": x_axe_name},
      {"type": "y", "scale": "y", "offset": 1, "title": y_axe_name}
    ],
    "legends": [
    {
      "fill": "c",
      "title": "Species",
      "offset": 0,
      "properties": {
        "symbols": {
          "fillOpacity": {"value": 0.5},
          "stroke": {"value": "transparent"}
        }
      }
    }],
    "marks": [
      {
        "type": mark_type,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": "data.value" },
            "y": {"scale": "y", "field": "data.location_name"},
            "fill": {"scale": "c", "field": "data.variable"},
            "width": {"scale": "x", "band": true, "offset": -1}
          },
          // "update": {
          //   "fill": {"value": "steelblue"}
          // },
          // "hover": {
          //   "fill": {"value": "green"}
          // }
        }
      }
      // {
      //   "type": "rect",
      //   "from": {"data": "table"},
      //   "properties": {
      //     "enter": {
      //       "x": {"scale": "x", "field": "data.location_name"},
      //       "x2": {"scale": "x", "field": "data."},
      //       "y": {"scale": "y", "field": "data"},
      //       "height": {"value": 2},
      //       "fill": {"value": "#557"}
      //     }
      //   }
      // },
      // {
      //   "type": mark_type,
      //   "interactive": false,
      //   "from": {"data": "table"},
      //   "properties": {
      //     "enter": {
      //       "x": {"scale": "x", "field": "data.value", "offset": 0},
      //       "y": {"scale": "y", "field": "data.x", "offset": 0},
      //       "width": {"scale": "x", "band": true, "offset": 6},
      //       "fill": {"value": "transparent"},
      //       "strokeWidth": {"value": 2}
      //     },
      //       "update": {
      //       "size": {"value": 100},
      //       "stroke": {"value": "transparent"}
      //     },
      //       "hover": {
      //       "size": {"value": 300},
      //       "stroke": {"value": "white"}
      //     }
      //   }
      // }
    ]
  };

  var data = {table: data_items};

  vg.parse.spec(spec, function(chart) {
    var view = chart({el:"#container", data:data})
      .on("mouseover", function(event, item) {
        // invoke hover properties on cousin one hop forward in scenegraph
        // view.update({
        //   props: "hover",
        //   items: item.cousin(1)
        // });
      })
      .on("mouseout", function(event, item) {
        // reset cousin item, using animated transition
        // view.update({
        //   props: "update",
        //   items: item.cousin(1),
        //   duration: 250,
        //   ease: "linear"
        // });
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
      data_items = JSON.parse(data).data
      min        = parseInt(JSON.parse(data).min)
      max        = parseInt(JSON.parse(data).max)
      x_axe_name = "Value"
      y_axe_name = ""

      draw_graph();
      $('#select_uniq_values_popup').modal('hide');
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
