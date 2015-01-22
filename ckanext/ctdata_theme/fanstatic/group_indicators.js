var ids_to_remove    = [],
    updated_inds     = {},
    $current_tr      = undefined;


$(function(){

  $('.close_popup').click(function() {
    $("#create_gallery_indicator_popup").modal('hide')
  });


  ///////////////// SHOW POPUP ////////////////////

  $('#edit_indicators').on('click', function(){
    $("#edit_indicators_popup").modal('show');
  });

  ///////////////////// Remember edits for indicator //////////////

  $('#update_indicators').on('click', function(){
    group_id = $('input#group_id').val()

    leave_in_group_ids = []
    remove_from_group_ids = []

    $('input:checkbox:checked').map(function(){
      leave_in_group_ids.push($(this).val())
    });

    $('input:checkbox:not(:checked)').map(function(){
      remove_from_group_ids.push($(this).val())
    });

    $('span.ajax_spinner').removeClass('hidden')
    $.ajax({type: "POST",
      url: "/group/update_group_indicators",
      data: JSON.stringify({ group_id: group_id,  leave_in_group_ids: leave_in_group_ids,remove_from_group_ids: remove_from_group_ids }),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });
  })


});
