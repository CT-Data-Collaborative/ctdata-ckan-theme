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

$(function(){
    var current_dataset;

    $.each(['towns', 'indicator'], function(i, popup_name) {
        var popup = $("#" + popup_name + "_popup");

        popup.modal({show: false});

        $('#add_' + popup_name).click(function() {
            popup.modal('show');
        });

        $('#close_' + popup_name + '_popup').click(function() {
            popup.modal('hide');
        });
    })

    $('#save_towns').click(function() {
        var towns = $('#towns').find('input:checked').map(function(i, e) {return $(e).val()}).get();
        window.location.search = 'towns=' + towns.join();
    });

    $('#save_indicator').click(function() {
        $.ajax({type: "POST",
            url: "/community/add_indicator",
            data: JSON.stringify({dataset_id: current_dataset,
                                  filters: get_filters()}),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
                window.location.reload();
            }
        });
    });

    $('.dataset_chooser').click(function() {
        current_dataset = $(this).attr('id');
        $.ajax({type: "GET",
            url: "/community/get_filters/" + current_dataset,
            success: function (data) {
                $('#filters').html(build_filters(data['result']));
            }
        });
    });

    $('.table_data').hover(function() {
        console.log('test');
        $(this).find('.close_pic').animate({opacity: 1.0}, 300);
    }, function () {
        $(this).find('.close_pic').animate({opacity: 0.0}, 300);
    });
});