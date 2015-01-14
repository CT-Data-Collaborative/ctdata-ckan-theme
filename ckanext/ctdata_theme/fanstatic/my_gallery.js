var ids_to_remove    = [],
    updated_inds     = {},
    $current_tr      = undefined;

function show_group_permission_input(){
  if ($('input.indicator_group:checked').length > 0){
    $('input.group_permission').removeClass('hidden');
    $('span.group_label').removeClass('hidden');
  }
  else{
    $('input.group_permission').addClass('hidden').removeAttr('checked');
    $('span.group_label').addClass('hidden').removeAttr('checked');
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

    if (updated_inds[ind_id] == undefined){
      $current_tr = $(this).closest('td').closest('tr')
      permission  = $current_tr.find('td.permission').text().replace(/\s\s/g, "");
      name        = $current_tr.find('td.name').text().replace(/\s\s/g, ""); //.slice(1, -1)
      group_ids   = []

      $current_tr.find('.group_id').map(function(){
        id = $(this).text().replace(/\s\s/g, "");
        group_ids.push(id)
      });

      updated_inds[ind_id] = {name: name, permission: permission, group_ids: group_ids}
    }
    else{
      name        = updated_inds[ind_id]['name'];
      permission  = updated_inds[ind_id]['permission'];
      group_ids   = updated_inds[ind_id]['group_ids'];
    }

    $('.indicator_name').val(name)
    $('input.indicator_permission').removeAttr('checked')
    $('input.indicator_group').removeAttr('checked')
    $('input.indicator_permission[value=' + permission + ']').attr('checked', true)
    group_ids.map(function(){
      $('input.indicator_group[value='+ $(this) +']').attr('checked', true)
    })

    show_group_permission_input();

    $("#create_gallery_indicator_popup").modal('show');
  });

  $('input.indicator_group:').on('change', function(){
    show_group_permission_input();
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

    $.ajax({type: "POST",
      url: "/user/update_gallery_indicator",
      data: JSON.stringify({ ind_params: ind_params }),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });

    $("#create_gallery_indicator_popup").modal('hide')
  })
});
