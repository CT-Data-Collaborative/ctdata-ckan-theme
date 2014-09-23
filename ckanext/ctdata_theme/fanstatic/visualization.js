$(function () {
    var dataset_id = $("#dataset_id").val(),
        dataset_title = $("dataset_title").val();

    $.ajax({type: "POST",
            url: "/data/" + dataset_id,
            data: JSON.stringify({view: 'chart',
                                  filters: [
                                 // {'field': 'Year', 'values': ['2008', '2009', '2010', '2011', '2012', '2013']},
                                             {'field': 'Town', 'values': ['Andover', 'Ansonia', 'New Haven']},
                                   //          {'field': 'Measure Type', 'values': ['Number']},
                                     //        {'field': 'Variable', 'values': ['Proficient or Above']},
                                       //      {'field': 'Subject', 'values': ['Reading']},
                                             {'field': 'Grade', 'values': ['K through 12']},
                                           //  {'field': 'Race', 'values': ['all']}
                                           ]
                                  }),
            contentType: 'application/json; charset=utf-8'}).done(function(data) {
        var series = data['data'],
            years = data['years'];

        console.log(years);
        console.log(series);

        $('#container').highcharts({
            title: {
                text: dataset_title,
                x: -20 //center
            },
            xAxis: {
                categories: years
            },
            yAxis: {
                plotLines: [{
                    value: 0,
                    width: 1,
                    color: '#808080'
                }]
            },
            legend: {
                layout: 'vertical',
                align: 'right',
                verticalAlign: 'middle',
                borderWidth: 0
            },
            series: series
        });
    })
});
