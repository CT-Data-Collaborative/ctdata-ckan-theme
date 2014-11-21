var create_popup    = $("#create_profile_popup"),
    ids_to_remove   = [];

$('.close_popup').click(function() {
  $(this).closest('div.modal').modal('hide');
});

$('#create_profile_button').click(function() {
  create_popup.modal('show');
});

$('#add_towns').click(function() {
    $("#towns_popup").modal('show');
})

$('.remove_indicator').on('click', function(){
    ids_to_remove.push( $(this).attr('id'));

    $(this).closest('tr').hide();
    $('#update_profile_indicators').show();
});

function load_functions_for_indicators(){
    $('.close_popup').click(function() {
      $(this).closest('div.modal').modal('hide');
    });

    $('.dataset_chooser').on('click',function() {
        $('li', $('ul.indicator-sub-topics')).removeClass('active')
        current_dataset = $(this).attr('id');
        $(this).closest('li').addClass('active');
        $.ajax({type: "GET",
            url: "/community/get_filters/" + current_dataset,
            success: function (data) {
                $('#filters_content').html(build_filters(data['result']));
            }
        });
    });

    $('#save_indicator').click(function() {
        $("#indicator_adding_error").animate({opacity: 0}, 300);
        $.ajax({type: "POST",
            url: "/community/add_indicator",
            data: JSON.stringify({dataset_id: current_dataset, name: "", headline: false,
                                  filters: get_filters()}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                if (data.success == true)
                    window.location.reload();
                else {
                    $("#error").html(data.error);
                    $("#error").animate({opacity: 1}, 300);
                }
            }
        });
    });


    $('#update_profile_indicators').on('click', function(){
        $.ajax({type: "POST",
          url: "/community/update_profile_indicators",
          data: JSON.stringify({ indicators_to_remove: ids_to_remove}),
          contentType: 'application/json; charset=utf-8',
          success: function (data) {
            window.location.reload();
          }
        });

    })
}
function load_topics(){
    if ($('#loaded_topics').html() == ""){
        $('#add_indicator').addClass('disabled')
        $('#remove_temp_indicators').addClass('disabled')
        $('#update_profile_indicators').addClass('disabled')
        $('#create_profile_button').addClass('disabled')
        $('#save_profile_as_default').addClass('disabled')
        $.ajax({type: "GET",
            url: "/community/get_topics/",
            success: function (data) {
                $('#loaded_topics').append($(data.html));
                load_functions_for_indicators();
                $('#add_indicator').removeClass('disabled')
                $('#remove_temp_indicators').removeClass('disabled')
                $('#update_profile_indicators').removeClass('disabled')
                $('#create_profile_button').removeClass('disabled')
                $('#save_profile_as_default').removeClass('disabled')
            }
        });
    }
}

$('#add_indicator').click(function() {
    $("#indicator_popup").modal('show');
});

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
            url: "/community/remove_temp_indicators",
            data: JSON.stringify({indicator_ids: ids}),
            contentType: 'application/json; charset=utf-8'
        });
    }
}

$('#remove_temp_indicators').on( 'click', function(){
    remove_temp_indicators();

    $(this).hide();
    $('.temp').closest('tr').hide();
});

$(function(){
    var current_dataset;

    $('#save_towns').click(function() {
        var towns = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        window.location.search = 'towns=' + towns.join();
    });

    $('#save_profile_as_default').click(function() {
        ids  = $('.indicator_id').text().split(' ').filter(Boolean).join()
        $.ajax({type: "POST",
            url: "/community/save_as_default",
            data: JSON.stringify({indicator_ids: ids}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                window.location.reload();
            }
        });
    });

    $('#create_profile').click(function() {
        ids  = $('.indicator_id').text().split(' ').filter(Boolean).join()
        name = $('input#profile_name').val()
        if (name != ''){
            $.ajax({type: "POST",
                url: "/community/add_profile",
                data: JSON.stringify({indicator_ids: ids, location: $('#location').text(), name: name}),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    data = JSON.parse(data)
                    if (data.success == true){
                        window.location = data.redirect_link
                    }
                }
            });
        }
    });

    $('.table_data').hover(function() {
        $(this).find('.close_pic').animate({opacity: 1.0}, 300);
    }, function () {
        $(this).find('.close_pic').animate({opacity: 0.0}, 300);
    });

    load_topics();
    $('#update_profile_indicators').hide();
    if ($('.temp').size() == 0) $('#remove_temp_indicators').hide()

    $("#profile_name").keyup(function(event){
        if(event.keyCode == 13){
            $("#create_profile").click();
        }
    });
    // $(window).bind('beforeunload', function(){
    //     remove_temp_indicators()
    // });
});