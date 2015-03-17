var create_popup    = $("#create_profile_popup"),
    ids_to_remove   = [],
    community_name  = $("input#community_name").val(),
    towns           = $("input#displayed_towns").val(),
    current_towns   = [],
    location_name   = $("#location").text(),
    new_indicators  = [],
    indicators      = [],
    locations       = location_names,
    default_profile_id = $('#default_profile_id').text(),
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

    function remove_temp_indicators(){
        if ($('.temp').size() != 0) {
            ids  = $('.indicator_id').text().split(' ').filter(Boolean).join()
            $.ajax({type: "POST",
                async: false,
                url: "/community/remove_temp_indicators",
                data: JSON.stringify({indicator_ids: ids}),
                contentType: 'application/json; charset=utf-8'
            });
        }
    }

    function draw_table(indicators_data, towns){

        table = "<table class='table my_table'>\
                    <thead>\
                        <th>Dataset</th>\
                        <th>Data Type</th>\
                        <th>Year</th>"

        $(towns).each(function(i){ table = table + '<th>' +towns[i] + '</th>' });
        table = table + "</thead><tbody>"

        indicators = []
        $(indicators_data).each(function(i){
            indicators.push({ id: indicators_data[i]['id'], dataset_id: indicators_data[i]['dataset_id'], name: "", ind_type: 'common',
                          permission: 'public', filters: indicators_data[i]['filters'], description: ''})

            tr = build_tr_from_data(indicators_data[i])

            table = table + tr
        });
        table = table +  "</tbody></table>";

        $(".table-div").html(table);
    }


    function load_profile_indicators(){
        $('.spinner').show();
        var deferred = $.Deferred();

        $.ajax({type: "POST",
            url: "/load_profile_indicators/" + default_profile_id,
            data: JSON.stringify({locations: locations}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                indicators_data = data.ind_data;
                current_towns   = data.towns;
                $('locations_list').text(data.towns);
                draw_table(indicators_data, current_towns);
                $('.spinner').hide();
            }
        });
    }

    function build_tr_from_data(indicators_data){
        ind = indicators_data
        id = ind.id
        ind.filters = JSON.parse(ind.filters)

        tr  = "<tr class='table_data'>\
                    <td class='column_1 for_csv'>\
                        <span class='indicator_id hidden'>" + id + " </span>"
        tr  = tr + "<a href='" + ind.link_to + "'>" + ind.dataset + ", " + ind.variable + " </a><span>"
        tr  = tr + "<span class='hidden' id='filters_json'>" + JSON.stringify(ind.filters) + "</span>"
        $(ind.filters).each(function(i){
            filter = ind.filters[i]
            tr = tr + filter.field + ': ' + filter.values[0]+ ' '
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
            tr = tr + "<td class='for_csv'><span class='for_csv'>" + value + "</span></td>"
        });
        tr = tr + "<td class='no-border'>\
                        <a href='javascript:void(0)' id=" + id + " class='hide_indicator' style='height: inherit;'>\
                            <img class='close_pic' style='opacity: 0; margin-left: 10px' src='/common/images/close_pic.png'>\
                        </a>\
                    </td>\
                </tr>";
        return tr
    }

    function draw_raw(indicators_data){
        tr = build_tr_from_data(indicators_data)
        $('tbody').append( tr )
    }

    function reload_data_for_new_indicators(){
        locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        locations = locations.join(',');
        $(new_indicators).each(function(i){
            ind = new_indicators[i]
            $.ajax({type: "POST",
                url: "/location/" + location_name + "/load_indicator",
                data: JSON.stringify({ dataset_id: ind['dataset_id'], name: "", ind_type: 'common',
                                       permission: 'public', filters: ind['filters'], description: '', locations: locations}),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    draw_raw(data.indicator);
                }
            });
        });
    }


$(function(){
    if (window.location.pathname != "/manage-locations"){
        load_profile_indicators();
        load_topics();
    }

  var form      = $('form#new_location')

  $('#save_location').on('click', function(){
    $.ajax({type: "POST",
      url: "/create_location",
      data: JSON.stringify({ name: $("#location_name").val(),
                             fips: $('#location_fips').val() }),

      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        $("#locations_list").append("<li class='span3'><span class='pull-left'><b>" + data.location_name +  "</b> </span> : <span class='pull-right'>" + data.location_fips + "</span></li>")
        $('#message').html("New location is saved.")
        $("#message_popup").modal('show');
      }
    });

  })

  /////////////////////


    $('.close_popup').live('click', function() {
        $(this).closest('div.modal').modal('hide');
    });

    $('#create_profile_button').live('click', function() {
        create_popup.modal('show');
    });

    $('#add_towns').live('click', function() {
        $("#towns_popup").modal('show');
    })

    // $('.remove_indicator').live('click', function(){
    //     ids_to_remove.push( $(this).attr('id'));

    //     $(this).closest('tr').hide();
    //     $.ajax({type: "POST",
    //       url: "/community/update_profile_indicators",
    //       data: JSON.stringify({ indicators_to_remove: ids_to_remove}),
    //       contentType: 'application/json; charset=utf-8',
    //       success: function (data) {}
    //     });
    // });

    $('.hide_indicator').live('click', function(){
        id = $(this).attr('id')
        filters_string = $(this).closest('tr').find("#filters_json").text().split(', ').join(',').split(': ').join(':')

        $(this).closest('tr').hide();

        found = false;
        index = undefined;
        $(indicators).each(function(i) {
            if (!found && id == $(indicators)[i].id ) {
                index = i;
                found=true
            };
        });

        if (index != undefined) {
            indicators.splice(index, 1);
            index = undefined
        };

        if (!found){
            all_filters = []
            $(new_indicators).each(function(i) {
                all_filters.push($(new_indicators)[i].filters.split(', ').join(',').split(': ').join(':'))
            });

            $(all_filters).each(function(i) {
                if (!found && filters_string == $(all_filters)[i]){
                    index = i;
                    found=true;
                }
            });
        }

        if (index != undefined) new_indicators.splice(index, 1);

    });


    $('.dataset_chooser').live('click',function() {
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

    $('#save_indicator').live('click', function() {
        $("#indicator_adding_error").animate({opacity: 0}, 300);
        locations = locations

        inds = indicators.concat(new_indicators)
        all_filters = []
        $(inds).each(function(i) {
            all_filters.push(inds[i]['filters'].split(', ').join(',').split(': ').join(':'))
        });

        if ( all_filters.indexOf( JSON.stringify(get_filters()) ) == -1){
            new_indicators.push({ id: null, dataset_id: current_dataset, name: "", ind_type: 'common',
                              permission: 'public', filters: JSON.stringify(get_filters()), description: ''})

            $.ajax({type: "POST",
                url: "/location/" + location_name + "/load_indicator",
                data: JSON.stringify({ dataset_id: current_dataset, name: "", ind_type: 'common',
                                       permission: 'public', filters: get_filters(), description: '', locations: locations}),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    if (data.success == true){
                        draw_raw(data.indicator);
                        $('div.modal').modal('hide');
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
    });

    $('#save_towns').click(function() {
        $('div.modal').modal('hide');
        locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        locations = locations.join(',');

        $('.spinner').show();

        $.ajax({type: "POST",
            url: "/load_profile_indicators/" + default_profile_id,
            data: JSON.stringify({locations: locations}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                indicators_data = data.ind_data;
                current_towns   = data.towns;
                $('locations_list').text(data.towns);
                draw_table(indicators_data, current_towns);
                reload_data_for_new_indicators();
                $('.spinner').hide();
            }
        });


    });

    $('#save_profile_as_default').click(function() {
        locations = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        locations = locations.join(',');
        inds      = indicators.concat(new_indicators)

        $.ajax({type: "POST",
            url: "/save_local_default/" + default_profile_id,
            data: JSON.stringify({indicators: inds, locations: locations}),
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
                url: "/location/" + location_name + "/create-profile",
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
