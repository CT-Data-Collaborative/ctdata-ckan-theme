var $main_dataset_select = $("select#dataset_name")


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

})
