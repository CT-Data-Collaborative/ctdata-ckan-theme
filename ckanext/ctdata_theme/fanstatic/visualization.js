$(function () {
    var dataset_id = $("#dataset_id").val(),
        dataset_title = $("dataset_title").val();

    $.ajax({type: "POST",
            url: "/series/" + dataset_id,
            data: JSON.stringify({towns: ['Bridgeport', 'Hartford', 'New Haven']}),
            contentType: 'application/json; charset=utf-8'}).done(function(data) {
        var series = [],
            years = data['years'];



        data['data'].forEach(function(val) {
            series.push({name: val['town'], data: val['values']});
        });

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