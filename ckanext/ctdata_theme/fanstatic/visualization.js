function get_filters(){
  var filters = [];
  dimensions = $("li.filter");
 
  $.each(dimensions, function(i){
    var cur_dim = $(dimensions[i]);
    var cur_filter = {'field': cur_dim.find('a').text(), 'values': []};
    var checked = cur_dim.find("input:checked")
  
    $.each(checked, function(option){
      cur_filter['values'].push(checked[option].value);
    });
    
    filters.push(cur_filter);
  });
  return filters;
}

$(function () {
    var dataset_id = $("#dataset_id").val(),
        dataset_title = $("dataset_title").val();

    $.ajax({type: "POST",
            url: "/data/" + dataset_id,
            data: JSON.stringify({view: 'chart',
                                  filters: [{'field': 'Year', 'values': ['2008', '2009', '2010', '2011', '2012', '2013']},
                                             {'field': 'Town', 'values': ['Andover', 'Ansonia', 'New Haven']},
                                             {'field': 'Measure Type', 'values': ['Number']},
                                             {'field': 'Variable', 'values': ['Proficient or Above']},
                                             {'field': 'Subject', 'values': ['Reading']},
                                             {'field': 'Grade', 'values': ['Grade 3']},
                                             {'field': 'Race', 'values': ['all']}]
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

