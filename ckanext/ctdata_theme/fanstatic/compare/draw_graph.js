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

  debugger
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
