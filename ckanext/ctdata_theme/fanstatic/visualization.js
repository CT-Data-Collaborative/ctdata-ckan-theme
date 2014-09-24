var default_filters = ["Ashford", "Ansonia", "New Haven", "2008", "2009", "2010", "2011", "1", "Percent", "Students absent 20 or more days"];

function check_defaults(){
  $.each(default_filters, function(i){
    $("li.filter").find("input[value='"+default_filters[i]+"']").prop('checked', true);
    });
}

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
    
    if(checked.length != 0)
      filters.push(cur_filter);
  });
  return filters;
}

$(function () {
    check_defaults()
    var dataset_id = $("#dataset_id").val(),
        dataset_title = $("dataset_title").val();

    $.ajax({type: "POST",
            url: "/data/" + dataset_id,
            data: JSON.stringify({view: 'chart',
                                  filters: get_filters()
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

