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



    //topics search

    $("#filter").keyup(function(){

        // Retrieve the input field text and reset the count to zero
        var filter = $(this).val();

        // Loop through the comment list
        $("#subtopic_list li").each(function(){

            // If the list item does not contain the text phrase fade it out
            if ($(this).text().search(new RegExp(filter, "i")) < 0) {
                $(this).fadeOut();
                $(this).addClass('hide');
            // Show the list item if the phrase matches and increase the count by 1
            } else {
                $(this).show();
                $(this).removeClass('hide');
            }

        });

        $("li.subtopic").each( function(){
            thiss = $(this)
            console.log(thiss.find('li').length)
            if (thiss.find('li').length == thiss.find('li.hide').length){
                $(thiss).fadeOut();
                $(thiss).addClass('hide');
                $(thiss).fadeOut();

                $(thiss).find('li.subtopic').addClass('hide');
                $(thiss).find('li.subtopic').fadeOut();
            } else {
                $(thiss).show();
                $(thiss).removeClass('hide');

                $(thiss).find('li.subtopic').show();
                $(thiss).find('li.subtopic').removeClass('hide');
            }
        });

        $("li.topics_list").each( function(){
            thiss = $(this)
            console.log(thiss.find('li').length)
            if (thiss.find('li').length == thiss.find('li.hide').length){
                $(thiss).fadeOut();
                $(thiss).addClass('hide');
                $(thiss).fadeOut();

                $(thiss).find('li.topics_list').addClass('hide');
                $(thiss).find('li.topics_list').fadeOut();
            } else {
                $(thiss).show();
                $(thiss).removeClass('hide');

                $(thiss).find('li.topics_list').show();
                $(thiss).find('li.topics_list').removeClass('hide');
            }
        });

    });



});