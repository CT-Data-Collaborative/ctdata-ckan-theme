$(function(){

  var form = $('form#new_location')

  $('#save_location').on('click', function(){
    $.ajax({type: "POST",
      url: "/create_location",
      data: JSON.stringify({ name: $("#location_name").val(),
                             fips: $('#location_fips').val() }),

      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        debugger

        $("#locations_list").append('<li>' + data.location_name + '</li>')

      }
    });

  })


});
