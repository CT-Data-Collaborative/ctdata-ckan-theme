var create_popup    = $("#create_profile_popup"),
    ids_to_remove   = [],
    community_name  = $("input#community_name").val(),
    towns           = $("input#displayed_towns").val(),
    location_name   = $("#location").text(),
    new_indicators  = [],
    indicators      = [],
    locations       = location_names,
    default_profile_id = $('#default_profile_id').text(),
    geo_types          = JSON.parse(geo_types),
    current_indicator  = undefined,
    remember_index     = undefined,
    found_in           = undefined,
    current_region     = undefined,
    current_dataset ;

function load_topics(){
    if ($('#loaded_topics').html() == ""){
        $('#add_indicator').addClass('disabled')
        $('#create_profile_button').addClass('disabled')
        $('#save_profile_as_default').addClass('disabled')
        $.ajax({type: "GET",
            url: "/community/get_topics/",
            success: function (data) {
                $('#loaded_topics').append($(data.html));
                $('#add_indicator').removeClass('disabled')
                $('#create_profile_button').removeClass('disabled')
                $('#save_profile_as_default').removeClass('disabled')
            }
        });
    }
}

function build_filters(filter_data) {
    var filters_html = '<ul>';
    $.each(filter_data, function(i, fltr) {
        filters_html += '<li>';
        filters_html += '<h3 class="indicator-filter-name">' + fltr.name + '</h3>';
        filters_html += '<ul>';
        $.each(fltr.values, function(j, val) {
            filters_html += '<li class="indicator-filter">';
            filters_html += '<span class="indicator-filter-value">' + val + '</span>';
            filters_html += '<input type="radio" class="indicator-filter-radio" name="' + fltr.name + '" value="' + val + '"';
            if (j == 0)
                filters_html += ' checked';
            filters_html += '>';
            filters_html += '</li>';
        });
        filters_html += '</ul>';
        filters_html += '</li>';
    });
    filters_html += '</ul>';

    return filters_html;
}

function get_filters() {
    return $('#filters').find('input:checked').map(function(i, e) {
        return {field: $(e).attr('name'), values: [$(e).val()]}
    }).get();
}

function get_updated_filters() {
    return $('#edit_indicator_filters').find('input:checked').map(function(i, e) {
        return {field: $(e).attr('name'), values: [$(e).val()]}
    }).get();
}

function draw_table(type, indicators_data, towns){
    table = "<table class='table my_table' id='table-" + type + "'>\
                <thead>\
                    <th>Dataset</th>\
                    <th>Data Type</th>\
                    <th>Year</th>"

    $(towns).each(function(i){ table = table + '<th>' +towns[i] + '</th>' });
    table = table + "</thead><tbody>"

    $(indicators_data).each(function(i){
        indicators.push({ id: indicators_data[i]['id'], dataset_id: indicators_data[i]['dataset_id'], name: "", ind_type: 'common',
                      aggregated: indicators_data[i]['aggregated'], towns: towns,
                      permission: 'public', filters: indicators_data[i]['filters'], description: '', geo_type: indicators_data[i]['geo_type'] })

        tr    = build_tr_from_data(indicators_data[i])
        table = table + tr
    });
    table = table + "</tbody></table>";

    $(".table-div-" + type).html(table);
}


function load_profile_indicators(){
    $('.spinner').show();
    var deferred = $.Deferred();

    $.ajax({type: "POST",
        url: "/load_profile_indicators/" + default_profile_id,
        data: JSON.stringify({locations: locations, ids_to_remove: ids_to_remove}),
        contentType: 'application/json; charset=utf-8',
        success: function (data) {
            indicators_data = data.ind_data;
            indicators      = []
            $('locations_list').text(data.all_current_locations);

            $(geo_types).each(function(i){
                type = geo_types[i]
                draw_table(type, indicators_data[type], data.locations_hash[type]);

                if (indicators_data[type].length == 0){
                    $('.edit_locations#' + type).addClass('hidden');
                    $('.table-div-' + type).addClass('hidden');
                }
                else{
                    $('.edit_locations#' + type).removeClass('hidden');
                    $('.table-div-' + type).removeClass('hidden');
                }
            });
            enable_options_for_profile();
            $('.spinner').hide();
        }
    });
}

function build_tr_from_data(indicators_data){
    ind = indicators_data
    id = ind.id
    ind.filters = JSON.parse(ind.filters)

    if (id != null && ids_to_remove.indexOf(id.toString()) > -1)
        tr  = "<tr class='table_data hidden'>"
    else
        tr  = "<tr class='table_data'>"

    tr  = tr +  "<td class='column_1 for_csv'>\
                    <span class='indicator_id hidden'>" + id + " </span>"
    tr  = tr + "<a href='" + ind.link_to + "'>" + ind.dataset + ", " + ind.variable + " </a><span>"
    tr  = tr + "<span class='hidden' id='filters_json'>" + JSON.stringify(ind.filters) + "</span>"
    $(ind.filters).each(function(i){
        filter = ind.filters[i]
        tr = tr + filter.field + ': ' + filter.values[0] + ' '
    });
    tr = tr + "</span>  <span class='for_csv hidden'>" + ind.dataset + ', ' + ind.variable + ', '
    $(ind.filters).each(function(i){
        filter = ind.filters[i]
        tr = tr + filter.field + ': ' + filter.values[0] + ' ' + ','
    });
    tr = tr + "</span>"
    tr = tr + "</td>\
            <td class='for_csv'><span class='for_csv'>" + ind.data_type + "</span></td>\
            <td class='for_csv'><span class='for_csv'>" + ind.year  + "</span></td>"

    $(ind.values).each(function(i){
        value = ind.values[i] || '-'
        text  = value.toString()
        array = text.split('.')

          if (jQuery.isNumeric(text) == true && array.length == 1)
            value = parseInt(text).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
          else{
            if (jQuery.isNumeric(text) == true && array.length == 2 && array[0].length > 4){
              array[0]  = parseInt(array[0]).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              value = array.join('.');
            }
          }

        tr = tr + "<td class='for_csv'><span class='for_csv'>" + value + "</span></td>"
    });
    tr = tr + "<td class='no-border'>\
                    <a href='javascript:void(0)' id=" + id + " dataset='" + ind.dataset_id + "' class='edit_indicator' style='height: inherit;'>\
                        <img class='close_pic' style='opacity: 0; margin-left: 10px' src='/common/images/pencil.png'>\
                    </a>\
                    <a href='javascript:void(0)' id=" + id + " class='hide_indicator' style='height: inherit;'>\
                        <img class='close_pic' style='opacity: 0; margin-left: 10px' src='/common/images/close_pic.png'>\
                    </a>\
                </td>\
            </tr>";
    return tr
}

function draw_raw(indicators_data, index){
    tr = build_tr_from_data(indicators_data)
    if (indicators_data['aggregated'])
        geo_type = 'regions'
    else
        geo_type = indicators_data['geo_type']

    if (index != null)
        $($('.table-div-' + geo_type).find('tbody').find('tr')[index]).replaceWith(tr)
    else
        $('.table-div-' + geo_type).find('tbody').append( tr )
}

function reload_data_for_new_indicators(){
    locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
    locations = locations.join(',');
    aggregated = $('#enable_data_aggregation').prop('checked');
    region_id  = $('select#regions').val();
    $(new_indicators).each(function(i){
        $('.spinner').show();
        ind = new_indicators[i]
        $.ajax({type: "POST",
            url: "/location/load_indicator",
            data: JSON.stringify({ dataset_id: ind['dataset_id'], name: "", ind_type: 'common', aggregated: ind['aggregated'], region_id: region_id,
                                   permission: 'public', filters: ind['filters'], description: '', locations: locations}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                draw_raw(data.indicator, null);
                geo_type = (data.indicator['aggregated'] ? 'regions' : data.indicator['geo_type'])
                $('.edit_locations#' + geo_type).removeClass('hidden');
                $('.table-div-' + geo_type).removeClass('hidden');
                $('.spinner').hide();
            }
        });
    });

}

function enable_options_for_profile(){
    if (indicators.length > 0 || new_indicators.length > 0){
        $('#create_profile_button').removeClass('hidden');
        $('.download_btn').removeClass('hidden');
        $('#add_indicator').closest('li').closest('ul').removeClass('add_indicator_button_in_center')
    }
    else{
        $('#create_profile_button').addClass('hidden');
        $('.download_btn').addClass('hidden');
        $('#add_indicator').closest('ul').closest('ul').addClass('add_indicator_button_in_center')
    }
    $('#add_indicator').closest('li').closest('ul').removeClass('hidden')
}

function draw_ind_if_towns_popup_closed(data){
    $('#towns_popup').on('hidden', function () {
        geo_type_locations = $('#towns').find('.location-checkbox').not('[class*="hidden"]').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        if (geo_type_locations.length == 0 || data.indicator['aggregated']){

            enable_options_for_profile();
            draw_raw(data.indicator, remember_index);
            geo_type = (data.indicator['aggregated'] ? 'regions' : data.indicator['geo_type'])
            $('.edit_locations#' + geo_type).removeClass('hidden');
            $('.table-div-' + geo_type).removeClass('hidden');
            $('div.modal').modal('hide');
            $('create_profile_button').removeClass('hidden');

        }
    });
}


function handle_incompatibles(){
    $.ajax({type: "POST",
      url: "/community/get_incompatibles/" + current_dataset,
      data: JSON.stringify({view: 'table', filters: get_filters()}),
      contentType: 'application/json; charset=utf-8'}).done(function(data) {
        apply_incompatibles(data.compatibles)
      });
}

function apply_incompatibles(compatibles){
    all_inputs = $('.indicator-filter-radio[name!="Measure Type"]')

    $.each(all_inputs, function(i){
        $input = $(all_inputs[i])
        found  = false
        jQuery.each(compatibles, function(i, c){  if (Object.keys(c)[0] == $input.attr('name') && c[Object.keys(c)[0]] == $input.val()) found = true })
        if(found){
          $input.removeAttr("disabled");
          $input.parent().find("span").css("color", "gray");
        }else{
          $input.attr("disabled", true);
          $input.attr("checked", false);
          $input.parent().find("span").css("color", "lightgray");
        }
    });
}

function collect_all_filters_for(indicators){
    all_filters = []
    $(indicators).each(function(i) {
        all_filters.push($(indicators)[i].filters.split(', ').join(',').split(': ').join(':'))
    });
    return all_filters
}

function find_indicator_by_filters_and_splice_it(filters){
    inds        = indicators.concat(new_indicators)
    all_filters = collect_all_filters_for(inds)
    index       = all_filters.indexOf(filters)

    if (current_indicator && index > -1){
        if ( index > indicators.length -1){
            i = index - indicators.length -1
            new_indicators.splice(i, 1)
        }
        else
            indicators.splice(index, 1)
    }
}

$(function(){
    if (window.location.pathname != "/manage-locations"){
        load_profile_indicators();
        load_topics();
    }

  var form = $('form#new_location');

  $(document).on('click', '.indicator-filter-radio', function (){
    handle_incompatibles()
  });

  $('#save_location').on('click', function(){
    $.ajax({type: "POST",
      url: "/create_location",
      data: JSON.stringify({ name: $("#location_name").val(),
                             fips: $('#location_fips').val(),
                             geography_type: $('#location_geography_type').val() }),

      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        $("#locations_list").append("<li class='span3'><span class='pull-left span2'><b>" + data.location_name +  "</b> </span> <span class='span1'>" + data.location_fips + "</span> <span class='pull-right span1'>" + data.location_geography_type + "</span> </li>")
        $('#message').html("New location is saved.")
        $("#message_popup").modal('show');
      }
    });

  })

  /////////////////////


    $(document).on('click', '.close_popup',function() {
        $(this).closest('div.modal').modal('hide');
    });

    $(document).on('click', '#create_profile_button', function() {
        create_popup.modal('show');
    });

    $(document).on('click', '.edit_locations', function() {
        type = $(this).attr('id')

        $('.location-checkbox').addClass('hidden')
        $('.location-checkbox.' + type).removeClass('hidden')
        // aggregated = $('#enable_data_aggregation').prop('checked')
        if (type != 'regions'){
            $('select#regions').hide()
            // $('select#regions').find('option').first().attr('selected', true)
        }
        else
           $('select#regions').show()

        $("#towns_popup").modal('show');
    })

    $(document).on('click', '.hide_indicator', function(){
        id = $(this).attr('id')
        filters_string = $(this).closest('tr').find("#filters_json").text().split(', ').join(',').split(': ').join(':')

        $(this).closest('tr').hide();

        found = false;
        index = undefined;
        $(indicators).each(function(i) {
            if (!found && id == $(indicators)[i].id ) {
                index = i;
                found = true
            };
        });

        if (index != undefined) {
            indicators.splice(index, 1);
            ids_to_remove.push(id)
        };

        if (!found){
            all_filters = collect_all_filters_for(new_indicators)
            $(all_filters).each(function(i) {
                if (!found && filters_string == $(all_filters)[i]){
                    index = i;
                    found=true;
                }
            });
        }

        if (index != undefined) new_indicators.splice(index, 1);
    });

    $(document).on('click', '.dataset_chooser', function() {
        $("#save_indicator").addClass('hidden')
        $('li', $('ul.indicator-sub-topics')).removeClass('active')
        current_dataset = $(this).attr('id');
        current_dataset_name = $(this).text();

        $(this).closest('li').addClass('active');
        $.ajax({type: "GET",
            url: "/community/get_filters/" + current_dataset,
            success: function (data) {
                $('#filters_content').html(build_filters(data['result']));
                $("#save_indicator").removeClass('hidden')
            }
        });
    });

    $(document).on('click', '.edit_indicator', function() {
        $("#update_indicator").addClass('hidden')
        current_dataset = $(this).attr('dataset');
        current_indicator = $(this).closest('tr');

        filters = JSON.parse(current_indicator.find("#filters_json").text())
        $(this).closest('li').addClass('active');
        $.ajax({type: "GET",
            url: "/community/get_filters/" + current_dataset,
            success: function (data) {
                $('#edit_indicator_filters_content').html(build_filters(data['result']));
                $(filters).each(function(i){
                    inputs = $('#edit_indicator_filters_content').find('input[name="' + filters[i].field +'"]')
                    inputs.prop('checked', false);
                    value = filters[i].values[0]
                    input = $('#edit_indicator_filters_content').find('input[name="' + filters[i].field +'"][value="'+value +'"]')
                    input.prop('checked', true);
                });

                $("#update_indicator").removeClass('hidden')
                $("#edit_popup").modal('show');
            }
        });
    });

    $(document).on('click', '#update_indicator', function() {
        id          = current_indicator.find('.hide_indicator').attr('id')
        old_filters = current_indicator.find("#filters_json").text().split(', ').join(',').split(': ').join(':')
        find_indicator_by_filters_and_splice_it(old_filters)

        if (id != null) ids_to_remove.push(id);
        remember_index = current_indicator.closest('tbody').find('tr').index(current_indicator)
        $('#save_indicator').click()
        current_indicator = undefined
    });

    $(document).on('click', '#save_indicator', function() {
        $("#indicator_adding_error").animate({opacity: 0}, 300);
        aggregated         = $('#enable_data_aggregation').prop('checked')
        region_id          = aggregated ? $('select#regions').val() : null
        current_region     = region_id
        geo_type_locations = $('#towns').find('.location-checkbox').not('[class*="hidden"]').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        new_filters        = get_filters()

        if (current_indicator != undefined) new_filters = get_updated_filters();

        find_indicator_by_filters_and_splice_it(JSON.stringify(new_filters));

        if ( index == -1 || current_indicator){
            new_indicators.push({ id: null, dataset_id: current_dataset, name: "", ind_type: 'common', aggregated: aggregated,
                          permission: 'public', filters: JSON.stringify(new_filters), description: ''});

            locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
            locations = locations.join(',');

            $.ajax({type: "POST",
                url: "/location/load_indicator",
                data: JSON.stringify({ dataset_id: current_dataset, name: "", ind_type: 'common', aggregated: aggregated, region_id: region_id,
                                       permission: 'public', filters: new_filters, description: '', locations: locations}),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    if (data.success == true){
                        if (data.indicator.locations_names.length > 0){
                            geo_type = (data.indicator['aggregated'] ? 'regions' : data.indicator['geo_type'])
                            enable_options_for_profile();
                            draw_raw(data.indicator, remember_index);
                            $('.edit_locations#' + geo_type).removeClass('hidden');
                            if (data.indicator['aggregated'])
                                $('.table-div-regions').removeClass('hidden');
                            else
                                $('.table-div-' + geo_type).removeClass('hidden');
                            $('div.modal').modal('hide');
                            $('create_profile_button').removeClass('hidden');

                        }
                        else{
                            enable_options_for_profile();
                            if (data.indicator['aggregated'])
                                current_geo_type = 'regions'
                            else
                                current_geo_type = $('#select_geography_type').val()
                            $('div.modal').modal('hide');
                            $('.edit_locations#' + current_geo_type).click()

                        }
                        // draw_ind_if_towns_popup_closed(data);
                    }
                    else {
                        $("#error").html(data.error);
                        $("#error").animate({opacity: 1}, 300);
                    }
                }
            });

        }
        else{
            $('div.modal').modal('hide');
            $('#message').html("Such indicator is already exists.")
            $("#message_popup").modal('show');
        }
    });


    $('#add_indicator').click(function() {
        $("#indicator_popup").modal('show');
        $('#select_geography_type').on('change', function(){
            $('#filters_content').html('<div id="filters_content">Choose a dataset from the leftside menu.</div>');
            value = $(this).val()
            $('li.dataset-name[class !=' + value + ']').addClass('hidden')
            $('li.dataset-name.' + value).removeClass('hidden')

            $('.location-checkbox').addClass('hidden')
            $('.location-checkbox.' + value).removeClass('hidden')
        });
    });

    $('.save_towns').click(function() {
        $('div.modal').modal('hide');
        locations  = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        locations  = locations.join(',');
        aggregated = $('#enable_data_aggregation').prop('checked')
        region_id  = aggregated ? $('select#regions').val() : current_region

        $('.spinner').show();

        $.ajax({type: "POST",
            url: "/load_profile_indicators/" + default_profile_id,
            data: JSON.stringify({locations: locations, ids_to_remove: ids_to_remove, aggregated: aggregated, region_id: region_id}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                indicators_data = data.ind_data;
                indicators      = []
                $('locations_list').text(data.all_current_locations);

                $(geo_types).each(function(i){
                    type = geo_types[i]
                    draw_table(type, indicators_data[type], data.locations_hash[type]);
                    if (indicators_data[type].length == 0){
                        $('.edit_locations#' + type).addClass('hidden');
                        $('.table-div-' + type).addClass('hidden');
                    }
                    else{
                        $('.edit_locations#' + type).removeClass('hidden');
                        $('.table-div-' + type).removeClass('hidden');
                    }
                    enable_options_for_profile();

                });
                $('.spinner').hide();
                reload_data_for_new_indicators();
            }

        });

    });

    $('#save_profile_as_default').click(function() {
        locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        locations = locations.join(',');
        inds      = indicators.concat(new_indicators)

        $.ajax({type: "POST",
            url: "/save_local_default/" + default_profile_id,
            data: JSON.stringify({indicators: inds, locations: locations, ids_to_remove: ids_to_remove}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                load_profile_indicators();
                new_indicators = []
                if (window.location.pathname.indexOf('/community/') > -1)
                    $('#message').html("<h3> Indicators saved successfully.</h3>")
                else
                    $('#message').html("<h3> Default indicators are successfully saved.</h3>")
                $("#message_popup").modal('show');
            }
        });
    });

    $('#create_profile').click(function() {
        name      = $('input#profile_name').val()
        locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        locations = locations.join(',');
        global_default = false ;
        inds =  indicators.concat(new_indicators);

        if (name != ''){
            $.ajax({type: "POST",
                url: "/location/create-profile",
                data: JSON.stringify({indicators: inds, locations: locations, name: name, global_default: global_default}),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    if (data.success == true){
                        $('div.modal').modal('hide');
                        $('#message').html("<h3>New profile has been successfully saved.</h3><br>  <a href='"+ data.redirect_link +"'> Click here </a> to view it.")
                        $("#message_popup").modal('show');
                    }
                    else{
                        $('div.modal').modal('hide');
                        $('#message').html("Error: " +  data.error)
                        $("#message_popup").modal('show');
                    }
                }
            });
        }
    });

    $("#profile_name").keypress(function(e){
        if (e.which === 13){
            return false;
        }
    });

});
