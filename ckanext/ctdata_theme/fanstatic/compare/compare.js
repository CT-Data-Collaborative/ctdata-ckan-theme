var $main_dataset_select = $("select#dataset_name"),
    $compare_with_select = $("select#compare_with"),
    matches              = {},
    x_axe_name           = "Value"
    y_axe_name           = "Geography",
    main_geo_type        = "Geography",
    mark_type            = "symbol",
    color                = 'data.Variable',
    shape                = 'data.shape',
    size                 = 'data.size',
    min                  = 0,
    max                  = 200000,
    x_dim                = "data.Value",
    y_dim                = "data.Geography",
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
          make_scalable();
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
  $("#matches ul").append('<li class="scale_variant">' + name + '<a href="javascript:void" class="cancel-drag pull-right icon-remove hidden" ></a></li>');
  make_scalable();
}

function show_matches_in_popup(dataset_matches){
  $.each(dataset_matches, function(i, item){
    key = Object.keys(item)[0]
    if (key != 'Variable'){
        without_spaces = key.replace(/\s/g, '-')
        addScale(key)
        $("ul.common_dimensions").append('<li class="common_li"> <h4>' + key + '</h4><ul class="common_li_ul '+ without_spaces +'"></ul></li>')
        make_scalable();
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

// function load_comparable_datasets(dataset_name){
//   $.ajax({type: "GET",
//       url: "/compare/load_comparable_datasets/" + dataset_name,
//       success: function (data) {
//         data = JSON.parse(data)
//         $('#datasets_to_compare_with').html('')
//         $('#datasets_to_compare_with').html($(data.html));
//         $compare_with_select = $("select#compare_with")
//         matches              = data.matches
//         main_geo_type        = data.main_geo_type
//         // y_axe_name           = data.main_geo_type
//         comparable           = data.comparable
//         $('.spinner').hide()
//       }
//   });
// }

function load_comparable_data(dataset){
  $.ajax({type: "GET",
      url: "/compare/load_comparable_dataset_data/" + dataset.name,
      data: dataset,
      success: function (data) {
        data = JSON.parse(data)
        dataset.dims_data  = data.dataset_data.dims
        dataset.title      = data.dataset_data.title
        dataset.filtering_html = data.dataset_data['filtering_html']

        $('.spinner').hide();
        $('#add_dataset_popup').modal('hide')

        if (dataset.filter)
          show_filter_popup_for(dataset);
        else{
          dataset_number = put_data_to_correct_dataset(dataset);
          show_dataset_dimensions(dataset, dataset_number);
        }

      }
  });
}


function show_filter_popup_for(dataset){
  $('#filter_dataset_popup').find('.modal-body').html(dataset.filtering_html);
  $('#filter_dataset_popup').modal('show');
  done_with_select_filters(dataset);
}

function done_with_select_filters(dataset){
  $('.done_with_select_filters').on('click', function(){

    $.each( dataset.dims_data, function(i, dim){
      dim.selected_value = $('input[name="' + dim.name + '"]:checked').val();
    });

    dataset.filtered = true
    dataset_number   = put_data_to_correct_dataset(dataset);
    show_dataset_dimensions(dataset, dataset_number);
    $('#filter_dataset_popup').modal('hide');
  });

  put_data_to_correct_dataset(dataset);
}

function empty_dataset_hash(){
  return { name: null, title: null, filter: false, filtered: false, geo_type: null, domain: null, dims_data: null, filtering_html: null }
}

var geo_type     = null,
    domain       = null,
    dataset      = null,
    dataset_1    = empty_dataset_hash(),
    dataset_2    = empty_dataset_hash(),
    matched_dims = [],
    wizard_matches = []
    wizard_applied = false;

function put_data_to_correct_dataset(dataset){
  dataset_number = null
  if (dataset.name == dataset_1.name || JSON.stringify(dataset_1) == JSON.stringify(empty_dataset_hash()) ){
    dataset_1 = dataset
    dataset_number = '1'
  }
  else
    if (dataset.name == dataset_2.name || JSON.stringify(dataset_2) == JSON.stringify(empty_dataset_hash()) ){
      dataset_2 = dataset;
      dataset_number = '2'
    }

  if (dataset_1.name) $('h3.dataset_1_title').text(dataset_1.title);
  if (dataset_2.name) $('h3.dataset_2_title').text(dataset_2.title);

  // if ($('#matches ul').html() == '') {
  //   addScale('Geography');
  //   addScale('Year');
  //   addScale('Measure Type');
  // };

  return dataset_number
}

function show_dataset_dimensions(d, dataset_number){
  if (d.dims_data){
    $content = $('#dataset_'+ dataset_number +'_dimensions ul.content');
    $content.html('')

    $.each(d.dims_data, function(i, item){
      // && ['Year', 'Measure Type', 'Variable'].indexOf(item.name) == -1
      if (item.name != d.geo_type ){
        $content.append('<li class="content-li" dataset_number="'+ dataset_number +'">' + item.filter_html + '</li>');
        $('li.content-li', $content).last().find('.scale_variant').attr('dataset_number', dataset_number)
      }
      // check selected item after filtering
      if (item.selected_value){
        $('.panel-collapse.collapse.dim', $content).last().find('input[value="'+ item.selected_value +'"]').prop('checked', true)
      }
      delete item.filter_html
    })

    if (dataset_number == '2' && !wizard_applied) fill_matches_for_wizard();
  }
}

function fill_matches_for_wizard(){
  $.each(dataset_1.dims_data, function(i, item){
    dataset_2_item = $.grep(dataset_2.dims_data, function( dim ) {
      return  dim.name == item.name ;
    })[0];

    if (dataset_2_item){
      dataset_2_item.matches = true;
                item.matches = true;
      matched_dims.push({
        name: item.name,
        dataset_1_values: item.possible_values,
        dataset_2_values: dataset_2_item.possible_values,
        same_values: $(item.possible_values).not($(item.possible_values).not(dataset_2_item.possible_values))
      })
    }
  });

  $.each(matched_dims, function(i, item){
    if (item.name != 'Geography'){
      $('.macthed_dimensions_select').append('<option>' + item.name + '</option>');

      css_class = (i == 1 ? '' : 'hidden')
      $.each(item.dataset_1_values, function(j, value){
        $('div#wizard_dataset_1 ul').append('<li class="wizard_option_li '+ css_class +'" name="'+ item.name +'">' + value + '</li><a href="javascript:void" class="cancel-drag pull-right icon-remove hidden"></a>')
      })

      $.each(item.dataset_2_values, function(j, value){
        $('div#wizard_dataset_2 ul').append('<li class="wizard_option_li '+ css_class +'" name="'+ item.name +'">' + value + '</li><a href="javascript:void" class="cancel-drag pull-right icon-remove hidden"></a>')
      })
    }

  });
  move_matched_dimensions_to_common();
  make_wizard_items_draggable_and_droppable();
  $('#match_wizard').modal('show');
  make_scalable();
}

function make_wizard_items_draggable_and_droppable(){
  wizard_matches = {}
  colors = ['dropped-bluegreen', 'dropped-red', 'dropped-orange', 'dropped-yellow', 'dropped-greenyellow']
  $('.wizard_option_li').draggable({revert: "invalid", helper: "clone"});
  $('.wizard_option_li').droppable({
    accept: ".wizard_option_li",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active",
    drop: function( event, ui ) {
      class_name   = colors[Math.floor(Math.random() * colors.length)];
      li_drop_area = $(event.target)
      li_drag_el   = $(ui.draggable)

      li_drop_area.addClass(class_name)
      li_drag_el.addClass(class_name)

      version_drop_area = li_drop_area.closest('ul').attr('version-number')
      version_drag_el   = li_drag_el.closest('ul').attr('version-number')
      drop_dataset      = version_drop_area == "1" ? dataset_1 : dataset_2
      drag_dataset      = version_drag_el   == "1" ? dataset_1 : dataset_2
      name = li_drop_area.attr('name')

      dim  = jQuery.grep(drop_dataset.dims_data, function( dim ) {
        return  dim.name == name ;
      })[0];
      hash = {}
      hash[li_drop_area.text()] = li_drag_el.text()
      dim.wizard_matches.push(hash)

      dim  = jQuery.grep(drag_dataset.dims_data, function( dim ) {
        return  dim.name == name ;
      })[0];
      hash = {}
      hash[li_drag_el.text()] = li_drop_area.text()
      dim.wizard_matches.push(hash)
    }

  })
}

function done_with_wizard_filters(){
  wizard_applied = true
  $('#match_wizard').modal('hide');
  get_compared_data_for_grap();
}

function get_compared_data_for_grap(){
  // send request to server, get compiled dataset, show the graph
  delete dataset_1.filtering_html
  delete dataset_2.filtering_html

  // data = {'dataset_1': dataset_1, 'dataset_2': dataset_2, 'wizard_matches': wizard_matches}
  $.ajax({type: "POST",
      url: "/compare_datasets",
      data: JSON.stringify({'dataset_1': dataset_1, 'dataset_2': dataset_2, 'wizard_matches': wizard_matches}),
      success: function (data) {
        data_items = JSON.parse(data).data
        debugger
        if (data_items.length > 0){
            // addScale(variable_2)
            // y_axe_name = variable_1
            // x_axe_name = variable_2
            // y_dim      = 'data.' + variable_2
            // x_dim      = 'data.' + variable_1

            // dragToDroppable('y', variable_1)
            // dragToDroppable('x', variable_2)
            // make_scalable();
            draw_graph();
            $('#select_uniq_values_popup').modal('hide');

        }else{
          $('#container').html('<div id="error">There is no available data to show. </div>')
          $('#select_uniq_values_popup').modal('hide');
        }
      }
  });

}

function move_matched_dimensions_to_common(){
  $.each(matched_dims, function(i, item){
    $('a.filter_dim[name="' + item.name + '"]').closest('li.content-li').remove();
    addScale(item.name);
  });
}

function make_scalable(){
  $('.scale_variant').draggable({revert: "invalid", helper: "clone"});
}

$(document).ready(function(){
  close_popup()

  $('.done_with_wizard_filters').on('click',  function(){
    done_with_wizard_filters()
  })

  $('a#add_dataset').on('click', function(){
    $('#add_dataset_popup').modal('show');
    dataset = empty_dataset_hash();
  });

  $('a.call-help').on('click', function(){
    $('#help_popup').modal('show');
  });

  $('select#geo_type').on('change',  function(){
    geo_type = $(this).val();

    $('select#domain').val( $('select#domain option:first').val() );
    $('select#domain').attr('disabled', false)
    $('select#dataset_name').val( $('select#dataset_name option:first').val() );
    $('select#dataset_name').attr('disabled', true)
  })

  $('select#domain').on('change',  function(){
    domain = $(this).val();

    $('.dataset_option').hide();
    $('.dataset_option[geo_type  = "'+ geo_type + '"][domain  ="'+ domain +'"]').show();
    $('select#dataset_name').val( $('select#dataset_name option:first').val() );
    $('select#dataset_name').attr('disabled', false)
  })

  $('a.filter_q').on('click', function(){
    dataset          = empty_dataset_hash()
    dataset.name     = $('select#dataset_name').val();
    dataset.geo_type = geo_type;
    dataset.domain   = domain;
    dataset.filter   = $(this).attr('filter') == "true";

    load_comparable_data( dataset )
  });

  $(document).on('change', 'input.filtering-dataset', function(){
    dataset_number = $(this).parent().parent().closest('li').attr('dataset_number')
    val  = $(this).val()
    name = $(this).attr('name')
    d    = (dataset_number == "1" ? dataset_1 : dataset_2)
    dim  = jQuery.grep(d.dims_data, function( dim ) {
      return  dim.name == name ;
    });

    dim[0].selected_value = val;
  });

  $('.macthed_dimensions_select').on('change', function(){
    version_number = $(this).attr('version-number');
    $('#wizard_dataset_' + version_number + ' li.wizard_option_li').addClass('hidden');
    $('#wizard_dataset_' + version_number + ' li.wizard_option_li[name="' + $(this).val() + '"]').removeClass('hidden');
    make_wizard_items_draggable_and_droppable();
  });

  // $main_dataset_select.on('change', function(){
  //   $('.spinner').show()
  //   $('#datasets_to_compare_with').html('')
  //   load_comparable_datasets( $(this).val() )
  // });

  make_scalable();
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
       debugger
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
          x_dim = 'data.y'; break;
        case "y":
          y_axe_name = 'y';
          y_dim = 'data.y'; break;
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

  $(document).on('click', '.cancel-drag-2', function(){
    $li = $(this).closest('span')
    // $li.find('a.filter_dim').addClass('hidden')

    dataset_number = $(this).parent().attr('dataset_number')

    id = $(this).closest('li').closest('div').attr('id');

    switch(id) {
        case "x":
          x_axe_name = 'x'
          x_dim = 'data.y'; break;
        case "y":
          y_axe_name = 'y';
          y_dim = 'data.y'; break;
        case "color_s":
          color = 'data.color'; break;
        case "size_s":
          size  = 'data.size'; break;
        case "shape_s":
          shape = 'data.shape'; break;
    }


    $li.insertBefore( $('.panel-collapse.collapse.dim[name="' + $li.find('a.filter_dim').attr('name') + '"]') )
    $li.closest('div').removeClass('dropped')
    $li.find('a.cancel-drag-2').hide()

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

    make_scalable();
    addScale(main_geo_type)
    check_first_inputs()
    $('#select_uniq_values_popup').modal('show');
  });

  $('#continue_button').on('click', function(){
    get_data();
  })

  $('.update-filters').on('click', function(){
    $('#select_uniq_values_popup').modal('show');
  })

})
