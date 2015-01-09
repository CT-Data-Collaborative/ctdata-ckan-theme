var ids_to_remove    = [],
    permissions_hash = {},
    names_hash       = {};

$(function(){
  $('.remove_indicator').on('click', function(){
    ids_to_remove.push( $(this).attr('id'));

    $(this).closest('tr').hide();
    $('#update_gallery_indicators').removeClass('disabled');
  });

  $('.edit_name').click( function(){
    $(this).hide();
    $(this).closest('td').find('input.edit_indicator_name').removeClass('hidden');
  })

  $('.edit_permission').click( function(){
    $(this).hide();
    $(this).closest('td').find('select.indicator_permission').removeClass('hidden');
  })


  $('input.edit_indicator_name').on('change', function(){
    names_hash[$(this).attr('id')] = $(this).val();
    $('#update_gallery_indicators').removeClass('disabled');
  });

  $('select.indicator_permission').on('change', function(){
    permissions_hash[$(this).attr('id')] = $(this).val();
    $('#update_gallery_indicators').removeClass('disabled');
  });


  $('#update_gallery_indicators').on('click', function(){
    console.log(permissions_hash)
    $.ajax({type: "POST",
      url: "/user/update_gallery_indicators",
      data: JSON.stringify({ names_hash: names_hash,
                             permissions_hash: permissions_hash,
                             indicators_to_remove: ids_to_remove}),
      contentType: 'application/json; charset=utf-8',
      success: function (data) {
        window.location.reload();
      }
    });
  })

});