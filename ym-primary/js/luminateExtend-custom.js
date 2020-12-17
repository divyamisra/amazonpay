(function($) {
  /* define init variables for your organization */
  luminateExtend({
    apiKey: 'ahrt3', 
    path: {
      nonsecure: 'http://honor.americanheart.org/site/', 
      secure: 'https://secure2.convio.net/amha/site/'
    }
  });

  jQuery(function() {
    
    jQuery('#from_url_js').val(document.referrer);
    jQuery('#from_browser').val(window.navigator.userAgent);

    /* UI handlers for the donation form example */
    if(jQuery('.donation-form').length > 0) {
      jQuery('.donate-select label').click(function() {
        if(jQuery(this).next('div').is('.level-other-input')) {
			jQuery('.level-other-input').slideDown();
          jQuery('#other-amount-entered').removeAttr('disabled');
          jQuery('#other-amount-entered').attr('name', 'other_amount_entered');
          jQuery('#other-amount-entered').focus();
        }
        else {
			jQuery('.level-other-input').slideUp();			
          jQuery('#other-amount-entered').attr('disabled', 'disabled');
          jQuery('#other-amount-entered').removeAttr('name');
        }
	  });

		// Get amount passed from query string
		let amount = jqcn.getQuerystring("amount");
		if (amount.length > 0) {
			populateAmount(amount);
		}

      jQuery('.donation-form').submit(function() {
		//move contact info details to billing info if any fields are blank
		jQuery('[id^=billing\\_]').each(function(){
		  if (jQuery(this).val() == ""){
			   jQuery(this).val(jQuery("[id='"+jQuery(this).attr("id").replace("billing_","donor_")+"']").val());
		  }
		});

		jQuery('input[name=compliance]').val("true");
		
        window.scrollTo(0, 0);
        jQuery(this).hide();
        jQuery(this).before('<div class="well donation-loading">' + 
                         'Thank You!  We are now processing your gift ...' + 
                       '</div>');
      });

		jQuery('.donation-form').validate();				   
		
		jQuery.validator.addMethod(
			"validDonation", 
			function(value, element) {
				if (value == 0 || (value >= 10 && value <= 500)) {
					return true;
				} else {
					return false;
				}
			},
			"Please enter an amount between $10 and $500"
		);

      jQuery('#donate-submit').click(function() {
		var form =jQuery('form.donation-form');
		jQuery(form).validate().settings.ignore = ":disabled,:hidden";
		if (jQuery(form).valid()) {
			if (jQuery('input[name=other_amount]').val() < 10) {
				alert("Please enter an amount $10 or greater");
				return false;
			}
			submitAmazonDonation();
		} else { 
			jQuery('label.error').attr('role','alert').attr('aria-atomic','true');
			const h = document.querySelector(".section-header-container");
			h.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"});
			return false;
		}
      });
    }

	/* bind any forms with the "luminateApi" class */
    luminateExtend.api.bind();
  });
})(jQuery);

// Get Amazon confirmation id
if (location.href.indexOf("amazonCheckoutSessionId") > 0) {
	// hide form - show loading
	window.scrollTo(0, 0);
	jqcn('.donation-form').hide();
	jqcn('.donation-form').before('<div class="well donation-loading">' +
			'Thank You!  We are now processing your donation from Amazon ...' +
			'</div>');
}

function donateAmazon(amazonCheckoutSessionId) {
	let lsForm = localStorage.getItem('ahaDonate');
	if (lsForm != null) {
		// verify checkout
		populateForm(lsForm);
		const amzAmt = localStorage.getItem('amz_aha_amt');
		amazonPayVerifyCheckout(amazonCheckoutSessionId, amzAmt);
	} else {
		// handle missing data
		console.log('no data found');
		jqcn('.donation-form').prepend('<div id="donation-errors" role="alert" aria-atomic="true" aria-live="assertive"><div class="alert alert-danger" role="alert">There was an error. Please check your payment details and try again.</div></div>');
		jqcn('.donation-loading').remove();
		jqcn('.donation-form').show();
	}
}

(function ($) {
	jQuery.extend({
		getQuerystring: function(name){
		  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		  var regexS = "[\\?&]" + name + "=([^&#]*)";
		  var regex = new RegExp(regexS);
		  var results = regex.exec(location.href);
		  if(results == null)
			return "";
		  else
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}
	});
})(jQuery);

const amzConfirmationId = jQuery.getQuerystring('amazonCheckoutSessionId');
jQuery(document).ready(function(){
	if (amzConfirmationId) {
		donateAmazon(amzConfirmationId);
	}
})

//copy donor fields to billing
jQuery('[id^=donor_]').each(function(){
  jQuery(this).blur(function(){
    jQuery("[id='"+jQuery(this).attr("id").replace("donor_","billing_")+"']").val(jQuery(this).val());
  });
});

// ADD QUERY STRING CODE
 	//check for any passed parameters
	if (jQuery.getQuerystring("s_src")) {
		jQuery('input[name=source]').val(jQuery.getQuerystring("s_src"));
	}
		
	if (jQuery.getQuerystring("level_id")) {
		jQuery('input[name=level_id][value='+jQuery.getQuerystring("level_id")+']').attr("checked","checked");
	}

	if (jQuery.getQuerystring("msource")) {
		jQuery('input[name=source]').val(jQuery.getQuerystring("msource"));
	}
		
	if (jQuery.getQuerystring("amount")) {
		jQuery('label.active').removeClass("active");
		jQuery('label.level_other').addClass("active");
		jQuery('.level-other-input').slideDown();
        jQuery('#other-amount-entered').removeAttr('disabled');
        jQuery('#other-amount-entered').attr('name', 'other_amount_entered');
		jQuery('input[name=other_amount]').val(jQuery.getQuerystring("amount"));
		jQuery('input[name=other_amount_entered]').val(jQuery.getQuerystring("amount"));
	}
	
	//autofill from querystring data
	jQuery('input[name="first_name"]').val(jQuery.getQuerystring("first"));
	jQuery('input[name="last_name"]').val(jQuery.getQuerystring("last"));
	jQuery('input[name="street1"]').val(jQuery.getQuerystring("street1"));	
	jQuery('input[name="dstreet2"]').val(jQuery.getQuerystring("street2"));	
	jQuery('input[name="city"]').val(jQuery.getQuerystring("city"));	
	jQuery('input[name="state"]').val(jQuery.getQuerystring("state"));	
	jQuery('input[name="zip"]').val(jQuery.getQuerystring("zip"));	
	jQuery('input[name="email"]').val(jQuery.getQuerystring("email"));	
// END QUERY STRING CODE 

function populateAmount(amount) {
	const match = jQuery('label[data-amount="' + amount + '"]');
	if(match.length>=1){
		jQuery(match).click();
		feeOption.coverFee();
	} else {
		jQuery('label.active').removeClass("active");
		jQuery('label.level_other').addClass("active");
		jQuery('.level-other-input').slideDown();
		jQuery('#other-radio').prop({'checked': true}).attr({'aria-checked': true});
		jQuery('#other-amount-entered').removeAttr('disabled');
		jQuery('#other-amount-entered').attr('name', 'other_amount_entered');
		jQuery('input[name=other_amount], input[name=gift_amount], input[name=other_amount_entered]').val(amount);
		jQuery('.btn-amt').text(amount)
		feeOption.coverFee();
	}
}

// GA Donation Success
(function(){
	var a = document.createElement('script');
	a.type = 'text/javascript';
	a.src = '../amazonpay/ym-primary/js/gaDonationSuccess.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(a, s);
})();
