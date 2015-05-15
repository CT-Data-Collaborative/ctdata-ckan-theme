var $main_dataset_select = $("select#dataset_name"),
    names_hash           = {}


function load_comparable_datasets(dataset_name){
  $.ajax({type: "GET",
      url: "/compare/load_comparable_datasets/" + dataset_name,
      success: function (data) {
        data = JSON.parse(data)
        $('#datasets_to_compare_with').html('')
        $('#datasets_to_compare_with').html($(data.html));
      }
  });
}

$(document).ready(function(){
  $main_dataset_select.on('change', function(){
    load_comparable_datasets( $(this).val() )
  });

  $(document).on('click', '.close_popup',function() {
    $(this).closest('div.modal').modal('hide');
  });

  $('.edit_matches').click( function(){
    $(this).hide();
    $(this).closest('td').find('span.matches').addClass('hidden')
    $(this).closest('td').find('input.edit_year_matches').removeClass('hidden');
  })

  $('input.edit_year_matches').on('change', function(){
    names_hash[$(this).attr('id')] = $(this).val();
    $('#update_years').removeClass('disabled').addClass('btn-success');
    $(this).addClass('hidden');
    $(this).closest('td').find('span.matches').text($(this).val())
    $(this).closest('td').find('span.matches').removeClass('hidden')
  });

  $('#update_years').on('click', function(){
    debugger
    $.ajax({type: "POST",
      url: "/compare/update_years_matches",
      data: JSON.stringify({ names_hash: names_hash}),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        $('#update_years').addClass('disabled').removeClass('btn-success');
        $('#message').text('Changes successfully saved.')
        $('#message_popup').modal('show');
      }
    });

  })

})
