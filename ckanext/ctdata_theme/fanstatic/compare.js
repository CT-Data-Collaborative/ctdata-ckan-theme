var $main_dataset_select = $("select#dataset_name"),
    names_hash           = {},
    years_to_remove      = []


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

function close_popup(){
  $('.close_popup').on('click',function() {
    $(this).closest('div.modal').modal('hide');
  });
}

$(document).ready(function(){
  close_popup()
  // $('#message_popup').modal('show');

  $main_dataset_select.on('change', function(){
    load_comparable_datasets( $(this).val() )
  });



})
