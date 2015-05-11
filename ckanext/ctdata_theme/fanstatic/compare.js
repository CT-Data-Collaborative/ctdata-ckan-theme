var $main_dataset_select = $("select#dataset_name")


function load_comparable_datasets(dataset_name){
  $.ajax({type: "GET",
      url: "/compare/comparable_datasets/" + dataset_name,
      success: function (data) {
          $('#loaded_topics').append($(data.html));
          $('#add_indicator').removeClass('disabled')
          $('#create_profile_button').removeClass('disabled')
          $('#save_profile_as_default').removeClass('disabled')
      }
  });
}

$(document).ready(function(){


  $main_dataset_select.on('change', function(){
    console.log( $(this).val() )
  });

})