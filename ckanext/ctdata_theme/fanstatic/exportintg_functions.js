///////////////////////// EXPORTING FUNCTIONS /////////////////////

function print_chart(){
  var chart = $("#container").highcharts();
  var svg = chart.getSVG();
  var canvas = document.createElement('canvas');
      canvas.width  = $("#container").width();
      canvas.height = $("#container").height();

  var ctx = canvas.getContext('2d');

  var img = document.createElement('img');
  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
  img.onload = function() {
      ctx.drawImage(img, 0, 0);
      myWindow=window.open('','','width=1200,height=1200');
      myWindow.document.write('<img src="' + canvas.toDataURL('image/png') + '">');
      myWindow.document.close();

      myWindow.focus();
      myWindow.print();
  };
}

function chart_with_table_to_png(){
  $('#chart_image').removeClass('hidden')
  var title = $("#dataset_title").val();
  var subtitle = $('#profile_info').text();
  $('#title_and_subtitle').html('<h2>' + title + '</h2>' + '<h4>' + subtitle + '</h4>');

  var chart = $("#container").highcharts();
  var svg = chart.getSVG();
  var width = $("#highcharts-container").width();
  var canvas = document.createElement('canvas');
      canvas.width  = $("#container").width();
      canvas.height = $("#container").height();

  var ctx = canvas.getContext('2d');
  var img = document.createElement('img');
  $('#link_to_second_table').addClass('hidden')

  var data_url = ''
  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
  img.onload = function() {
      ctx.drawImage(img, 0, 0);
      data_url = canvas.toDataURL('image/png')
      $('img#chart_image').attr('src', data_url)
      $('div#double_export').width($('#second_table').width() + 100)
      html2canvas($('div#double_export')[0], {
          onrendered: function(canvas) {
              theCanvas = canvas;
              canvas.toBlob(function(blob) {
                  saveAs(blob, "chart.png");
                  $('#chart_image').attr('src', '')
                  $('#title_and_subtitle').html('')
                  $('#chart_image').addClass('hidden')
                  $('#link_to_second_table').removeClass('hidden')
                  $('div#double_export').width('auto')
              });
          }
        });
  };
}


function chart_with_table_to_pdf(){
  $('#chart_image').removeClass('hidden')
  var title = $("#dataset_title").val();
  var subtitle = $('#profile_info').text();
  $('#title_and_subtitle').html('<h2>' + title + '</h2>' + '<h4>' + subtitle + '</h4>');

  var chart = $("#container").highcharts();
  var svg = chart.getSVG();
  var canvas = document.createElement('canvas');
      canvas.width  = $("#container").width();
      canvas.height = $("#container").height();

  var ctx = canvas.getContext('2d');
  var img = document.createElement('img');

  $('#link_to_second_table').addClass('hidden')

  var data_url = ''
  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
  img.onload = function() {
      ctx.drawImage(img, 0, 0);
      data_url = canvas.toDataURL('image/jpeg')
      $('img#chart_image').attr('src', data_url)
      $('div#double_export').width( $('#second_table').width() + 100);
      html2canvas($('div#double_export')[0], {
          onrendered: function(canvas) {
            theCanvas = canvas;

            var imgData = canvas.toDataURL('image/jpeg');
            var ctx     = canvas.getContext( '2d' );
            var doc     = new jsPDF('l', 'pt', [ctx.canvas.height, ctx.canvas.width]);

            doc.addImage(imgData, 'jpeg', 10, 20);
            doc.output('save', 'chart.pdf')
            $('#chart_image').attr('src', '')
            $('#title_and_subtitle').html('')
            $('#chart_image').addClass('hidden')
            $('#link_to_second_table').removeClass('hidden')
            $('div#double_export').width('auto')
          }
        });
  };
}

function chart_to_pdf(){
  $('#only_chart_image').removeClass('hidden')
  var title    = $("#dataset_title").val();
  var subtitle = $('#profile_info').text();
  if (display_type != 'map')
    $('#title_info').html('<h2>' + title + '</h2>' + '<h4>' + subtitle + '</h4>');

  var chart = $("#container").highcharts();
  var svg = chart.getSVG();
  var canvas = document.createElement('canvas');
      canvas.width  = $("#container").width();
      canvas.height = $("#container").height();

  var ctx = canvas.getContext('2d');
  var img = document.createElement('img');

  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
  $('img#only_chart_image').attr('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))))
  img.onload = function() {
      ctx.drawImage(img, 0, 0);
      data_url = canvas.toDataURL('image/png')

      html2canvas($('div#only_chart')[0], {
          onrendered: function(canvas) {
              theCanvas = canvas;

            var imgData = canvas.toDataURL('image/jpeg');
            var ctx     = canvas.getContext( '2d' );
            var doc     = new jsPDF('l', 'pt', [ctx.canvas.height, ctx.canvas.width]);

            doc.addImage(imgData, 'jpeg', 10, 20);
            doc.output('save', 'chart.pdf')

            $('#only_chart_image').attr('src', '')
            $('#only_chart_image').addClass('hidden')
            $('#title_info').html('')
          }
        });
  };
}

function chart_to_png(){
  $('#only_chart_image').removeClass('hidden')
  var title    = $("#dataset_title").val();
  var subtitle = $('#profile_info').text();
  if (display_type != 'map')
    $('#title_info').html('<h2>' + title + '</h2>' + '<h4>' + subtitle + '</h4>');

  var chart = $("#container").highcharts();
  var svg = chart.getSVG();
  var canvas = document.createElement('canvas');
      canvas.width  = $("#container").width;
      canvas.height = $("#container").height;

  var ctx = canvas.getContext('2d');
  var img = document.createElement('img');

  img.setAttribute('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))));
  $('img#only_chart_image').attr('src', 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg))))

  img.onload = function() {
      ctx.drawImage(img, 0, 0);
      data_url = canvas.toDataURL('image/png')
      html2canvas($('div#only_chart')[0], {
          onrendered: function(canvas) {
              theCanvas = canvas;
              canvas.toBlob(function(blob) {
                  saveAs(blob, "chart.png");
                  $('#only_chart_image').addClass('hidden')
                  $('#only_chart_image').attr('src', '')
                  $('#title_info').html('')

              });
          }
        });

  };
}

function save_chart_image(){
  if (display_type != 'map') {
    bootbox.confirm("Do you want to include data table?", function(r){
      if (r) {
        if ($('#second_table').attr('class') == "collapse")
          $('a[href="#second_table"]').click()

        chart_with_table_to_png()
      }
      else
        chart_to_png();
    })
  }
  else
    chart_to_png();
}

function save_chart_pdf(){
  if (display_type != 'map') {
    bootbox.confirm("Do you want to include data table?", function(r){
      if (r){
        if ($('#second_table').attr('class') == "collapse")
          $('a[href="#second_table"]').click()

        chart_with_table_to_pdf()
      } else
        chart_to_pdf()
    })
  } else
    chart_to_pdf()
}

///////////////////////// EXPORTING FUNCTIONS /////////////////////