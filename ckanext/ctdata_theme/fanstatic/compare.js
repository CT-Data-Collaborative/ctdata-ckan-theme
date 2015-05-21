var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {};


function load_comparable_datasets(dataset_name){
  $.ajax({type: "GET",
      url: "/compare/load_comparable_datasets/" + dataset_name,
      success: function (data) {
        data = JSON.parse(data)
        $('#datasets_to_compare_with').html('')
        $('#datasets_to_compare_with').html($(data.html));
        $compare_with_select = $("select#compare_with")
        matches = data.matches
      }
  });
}

function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

$(document).ready(function(){
  close_popup()
  // $('#message_popup').modal('show');

  $main_dataset_select.on('change', function(){
    load_comparable_datasets( $(this).val() )
  });

  $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
  $('.droppable').droppable({
    accept: ".scale_variant",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active",
    drop: function( event, ui ) {
      $(this).addClass( "dropped" ) //.find( "span" ).html( ui.draggable.text());
      ui.draggable.find('a').removeClass('hidden')
      $(ui.draggable).detach().css({top: 0,left: 0}).appendTo(this);
    }
  });

  $(document).on('click', '.cancel-drag', function(){
    $li = $(this).closest('li')
    $li.find('a').addClass('hidden')
    $(this).closest('li').closest('div').removeClass('dropped')
    $("#matches ul").append($li )
  })

  $(document).on('change', "select#compare_with" , function(){
    $("#matches ul").html('<li class="scale_variant"> Town <a href="javascript:void" class="cancel-drag pull-right icon-remove hidden" ></a></li>')
    $('#dataset_name_val').text( $main_dataset_select.val() )
    $('#compare_with_val').text( $(this).val() )

    dataset_matches = matches[$(this).val()]

    $.each(dataset_matches, function(i, item){
      key = Object.keys(item)[0]
      $("#matches ul").append('<li class="scale_variant">' + key + '<a href="javascript:void" class="cancel-drag pull-right icon-remove hidden" ></a></li>' )
      $('.scale_variant').draggable({revert: "invalid", helper: "clone"})
      // $.each(item[key], function(j, value){
      //   $("#matches ul").append('<li class="">' + value + '</li>' )
      // })
    });

  });


  var spec = {
    "width": 400,
    "height": 200,
    "padding": {"top": 10, "left": 30, "bottom": 30, "right": 10},
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
      {"type": "x", "scale": "x"},
      {"type": "y", "scale": "y"}
    ],
    "marks": [
      {
        "type": "rect",
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
            "fill": {"value": "red"}
          }
        }
      },
      {
        "type": "rect",
        "interactive": false,
        "from": {"data": "table"},
        "properties": {
          "enter": {
            "x": {"scale": "x", "field": "data.x", "offset": -3.5},
            "y": {"scale": "y", "field": "data.y", "offset": -3.5},
            "y2": {"scale": "y", "value": 0, "offset": 3.5},
            "width": {"scale": "x", "band": true, "offset": 6},
            "fill": {"value": "transparent"},
            "stroke": {"value": "red"},
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




})
