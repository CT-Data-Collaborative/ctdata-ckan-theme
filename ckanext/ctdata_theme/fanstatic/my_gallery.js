var ids_to_remove    = [],
    updated_inds     = {},
    $current_tr      = undefined;


function show_groups_list_or_hide(){
  if ($('input.private_permission:checked').length > 0 ){
    $('input.indicator_group:checked').prop('checked', false);
    $('.groups_inputs').addClass('hidden')
  }
  else{
    $('.groups_inputs').removeClass('hidden')
  }
}

$(function(){
  $('.create_headline_indicator').html('Update')
  $('.close_popup').click(function() {
    $("#create_gallery_indicator_popup").modal('hide')
  });

  $('.remove_indicator').on('click', function(){
    ids_to_remove.push( $(this).attr('id'));

    $(this).closest('tr').hide();
    $('#remove_gallery_indicators').removeClass('disabled');
  });


  $('#remove_gallery_indicators').on('click', function(){
    $.ajax({type: "POST",
      url: "/user/remove_gallery_indicators",
      data: JSON.stringify({indicators_to_remove: ids_to_remove}),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });
  })

  ///////////////// SHOW POPUP ////////////////////

  $('.edit_indicator').on('click', function(){
    ind_id = $(this).attr('id')

    $('.filters_info').addClass('hidden')

    $current_tr = $(this).closest('td').closest('tr')
    permission  = $current_tr.find('td.permission').text().replace(/\s\s/g, "");
    name        = $current_tr.find('td.name').text().replace(/\s\s/g, ""); //.slice(1, -1)
    group_ids   = []

    $current_tr.find('.group_id').map(function(){
      id = $(this).text().replace(/\s\s/g, "");
      group_ids.push(id)
    });

    console.log($current_tr)
    console.log(group_ids)
    $('.indicator_name').val(name)
    $('input.indicator_permission').removeAttr('checked')
    $('input.indicator_permission[value=' + permission + ']').attr('checked', true)
    $('input.indicator_group').prop('checked', false)

    $.each(group_ids, function(i){
      $('input.indicator_group[value='+ group_ids[i] +']').attr('checked', true)
    });

    show_groups_list_or_hide();

    $("#create_gallery_indicator_popup").modal('show');
  });

  $('input.indicator_permission').on('change', function(){
     show_groups_list_or_hide();
  });

  ///////////////////// Remember edits for indicator //////////////

  $('.create_headline_indicator').on('click', function(){
    permission = 'public'
    if ($('input:radio:checked').val() != undefined){
      permission = $('input:radio:checked').val()
    }

    $form = $(this).closest('.modal-content').find('form');
    name  = $form.find('.indicator_name').val();
    group_ids = []

    $form.find('input:checked.indicator_group').map(function(){
      group_ids.push($(this).val());
    });

    ind_params = {id: ind_id, name: name, permission: permission, group_ids: group_ids}

    $('span.ajax_spinner').removeClass('hidden')
    $.ajax({type: "POST",
      url: "/user/update_gallery_indicator",
      data: JSON.stringify({ ind_params: ind_params }),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });


  })
});
