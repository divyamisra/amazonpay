// pull in gift array from LO
(function ($) {
    $(document).ready(function ($) {

    });
}(jQuery));


var eventName = luminateExtend.global.eventName;
var srcCode = luminateExtend.global.srcCode;
var subSrcCode = luminateExtend.global.subSrcCode;
var evID = $('body').data('fr-id') ? $('body').data('fr-id') : null;
var dfID = $('body').data('df-id') ? $('body').data('df-id') : null;
var consID = $('body').data('cons-id') ? $('body').data('cons-id') : null;

window.giftArray = {};

if ($('body').is('.pg_personal')) {
    // Personal Page
      var progress = $('#progress-amount').text();
      var goal = $('#goal-amount').text();
      cd.runThermometer(progress, goal);
      cd.reorderPageForMobile();
      cd.setDonorRollHeight();

      // populate custom personal page content
      $('.js--personal-text').html($('#fr_rich_text_container').html());

      // populate donor honor roll
      cd.getTeamHonorRoll();


      // Build personal donation form
      cd.getDonationFormInfo = function(options) {
        luminateExtend.api({
          api: 'donation', 
          requestType: 'POST', 
          data: 'method=getDonationFormInfo&fr_id=' + evID + '&form_id=' + dfID, 
          requiresAuth: true, 
          callback: {
            success: function(response) {
                var i = 0,
                donationLevels = luminateExtend.utils.ensureArray(response.getDonationFormInfoResponse.donationLevels.donationLevel);

                $.each(donationLevels, function(i){
                  var userSpecified = this.userSpecified,
                  amountFormatted = this.amount.formatted.replace('.00',''),
                  levelID = this.level_id;

                  i++;

                  if(userSpecified == 'false'){
                    // build pre-defined giving levels
                    $('.donation-amounts').append('<label class="form-check-label donation-amount-btn btn mb-3" for="personalDonAmt' + i + '" data-level-id="' + levelID + '"> <input class="form-check-input" type="radio" name="personalDonAmt" id="personalDonAmt' + i + '" value="' + levelID + '"> ' + amountFormatted + '</label>');                      
                  } else {
                    // build user-specified level
                    $('.donation-amounts').append('<div class="custom-amount"> <input class="form-check-input sr-only" type="radio" name="personalDonAmt" id="personalDonAmt' + i + '" value="' + levelID + '"> <label class="js--don-amt-other sr-only" for="personalDonAmt' + i + '" data-level-id="' + levelID + '">Enter your own amount</label> <label class="form-label d-inline-block" for="personalOtherAmt">Custom Amount:</label><br/> <input type="text" id="personalOtherAmt" class="form-control d-inline-block js--personal-amt-other"/> </div>');                     
                  }
                });


                    $('.js--personal-don-form').removeClass('hidden');
                    var defaultDonUrl = $('.js--personal-don-submit').data('don-url');
                    var finalDonUrl = null;
                    $('.js--personal-don-submit').attr('data-final-don-url', defaultDonUrl);

                    // define donation widget button behavior
                    $('.js--personal-don-form label').on('click', function(){
                      $('.js--personal-amt-other').val('');
                      $('.js--personal-don-form .donation-amount-btn').removeClass('active');
                      $('.paymentSelType').addClass('hidden');
                      $(this).addClass('active');
                      $('.js--don-amt').text($(this).text());
                      finalDonUrl = defaultDonUrl + '&set.DonationLevel=' + $(this).data('level-id');
                      $('.js--personal-don-submit').attr('data-final-don-url', finalDonUrl);

                   });
                
                    // format "other" amount before submitting to native donation form
                    // $('.js--personal-amt-other').on('blur', function(e){
                    //   var keyCode = (e.keyCode ? e.keyCode : e.which);
                    //   if (keyCode !== 9) {
                    //   var customAmt = parseInt($(this).val()) * 10;

                    //   finalDonUrl = defaultDonUrl + '&set.DonationLevel=' + $('.js--don-amt-other').data('level-id') + (isNaN(customAmt) === true ? '' : '&set.Value=' + customAmt);

                    //   if($(this).val()){
                    //     $('.js--don-amt').text('$' + $(this).val());
                    //   } else if($('.custom-amount .form-check-input').is(':checked') === true) {
                    //     $('.js--don-amt').text('');
                    //   }
                    //   console.log('final url BLUR: ', finalDonUrl);
                    // } 
                    // });

                    $('.js--personal-amt-other').on('keyup', function(e){
                      var keyCode = (e.keyCode ? e.keyCode : e.which);
                      console.log('keyCode: ', keyCode);
                      $('.paymentSelType').addClass('hidden');
                      if (keyCode != 9) {
                        $('.js--personal-don-form .donation-amount-btn').removeClass('active');
                        $('.custom-amount input[name="personalDonAmt"]').prop('checked', true);
                        if($(this).val()){
                          $('.js--don-amt').text('$' + $(this).val());
                        } else {
                          $('.js--don-amt').text('');
                        }
                        var customAmt = parseInt($(this).val()) * 10;

                        finalDonUrl = defaultDonUrl + '&set.DonationLevel=' + $('.js--don-amt-other').data('level-id') + (isNaN(customAmt) === true ? '' : '&set.Value=' + customAmt);
                        $('.js--personal-don-submit').attr('data-final-don-url', finalDonUrl);
                      }
                    });

                    // Set default donation amount
                    $('input[name="personalDonAmt"]').eq(0).click().prop('checked', true).closest('.donation-amount-btn').addClass('active');
                    $('.js--don-amt').text($('.form-check-label').eq(0).text().trim());

                    // redirect is now managed in amazonpay.js
                    // $('.js--personal-don-form').on('submit', function(e){
                    //   e.preventDefault();
                    //   // redirect to personal donation form with preselected amount
                    //   window.location.href = finalDonUrl;
                    // });

            }, 
            error: function(response) {
                // $('.field-error-text').text(response.errorResponse.message);
                // $('.ErrorContainer').removeClass('hidden');
            }
          }
        });
      };
      cd.getDonationFormInfo();
  }