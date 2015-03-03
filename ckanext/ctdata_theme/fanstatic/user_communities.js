var ids_to_remove = [],
    names_hash = {};

$(function(){
  // $('.remove_profile').on('click', function(){
  //   ids_to_remove.push( $(this).attr('id'));

  //   $(this).closest('tr').hide();
  //   $('#update_user_communities').removeClass('disabled');
  // });

  // $('.edit_name').click( function(){
  //   $(this).hide();
  //   $(this).closest('td').find('input.edit_profile_name').removeClass('hidden');
  // })

  // $('input.edit_profile_name').on('change', function(){
  //   names_hash[$(this).attr('id')] = $(this).val();
  //   $('#update_user_communities').removeClass('disabled');
  // });

  // $('#update_user_communities').on('click', function(){
  //   $.ajax({type: "POST",
  //     url: "/user/update_community_profiles",
  //     data: JSON.stringify({ names_hash: names_hash,
  //                            profiles_to_remove: ids_to_remove}),
  //     contentType: 'application/json; charset=utf-8',
  //     success: function (data) {
  //       window.location.reload();
  //     }
  //   });

  // })

  $('.remove_profile').on('click', function(){
    id = $(this).attr('id')
    $(this).closest('li').hide();
    bootbox.confirm("Are you sure you want to delete this profile?", function(r){
        if (r) {
          $.ajax({type: "POST",
            url: "/remove_location_profile/" + id,
            data: JSON.stringify({ }),
            contentType: 'application/json; charset=utf-8',
            success: function (data) {
              // window.location.reload();
            }
          });
        }
    });

  });

});