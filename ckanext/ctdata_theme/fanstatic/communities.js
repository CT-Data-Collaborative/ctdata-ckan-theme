$(function(){
    $('#add_ind').click(function() {
        $.ajax({type: "POST",
                url: "/community/add_indicator",
                data: JSON.stringify({dataset_id: 'cmt2',
                       filters: [ //no Town filter there
                           {field: 'Year', values: ['2012']},
                           {field: 'Measure Type', values: ['Number']},
                           {field: 'Variable', values: ['Proficient or Above']},
                           {field: 'Subject', values: ['Reading']},
                           {field: 'Grade', values: ['Grade 3']},
                           {field: 'Race', values: ['all']}]})  ,
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    window.location.reload();
                }
        });
    });

    $('#add_towns').click(function() {
        var community_name = $("#community_name").val();
        $.ajax({type: "POST",
                url: "/community/" + community_name + "/add_towns",
                data: JSON.stringify({towns: ['Ansonia', 'Berlin']}),
                contentType: 'application/json; charset=utf-8',
                success: function (data) {
                    window.location.reload();
                }
        });
    });
});