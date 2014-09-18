$(document).ready(function(){
    $('#data_by_topic_link').addClass('header_link_active');

    var topics = ['civic_vitality', 'demographics', 'economy', 'health', 'education', 'housing', 'safety'],
        last_clicked_link = '';

    $('#all_data_link').click(function() {
        $('.topics_list').css({display: "none"});
        $('#all_data').css({display: "block"});
        $('#triangle').css({display: "none"});
        last_clicked_link = '';
    });

    topics.forEach(function(topic) {
        $('#topic_' + topic + '_link').click(function() {
            $('.topics_list').css({display: "none"});
            $('#topic_' + topic).css({display: "block"});
            $("#triangle").offset({left: $("#topic_" + topic + "_link").offset().left + 40});
            $('#triangle').css({display: "block"});
            last_clicked_link = '#topic_' + topic + '_link';
        });
    });

    $( window ).resize(function() {
        if (last_clicked_link !== '') {
            $("#triangle").offset({left: $(last_clicked_link).offset().left + 40});
        }
    });

    var current_hash = $(location).attr('hash');

    if (current_hash && current_hash.length > 0) {
        $(current_hash + "_link").trigger('click');
    }
});