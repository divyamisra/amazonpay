jQuery(document).ready(function() {
	jQuery('#from_url_js').val(document.referrer);

	var evid = jQuery.getQuerystring("FR_ID");
	var apiURL = 'https://www2.heart.org/site/CRTeamraiserAPI?luminateExtend=1.7.1&method=getTeamraisersByInfo&name=%25%25%25&list_filter_column=frc.fr_id&list_filter_text='+evid+'&list_page_size=500&list_ascending=false&list_sort_column=event_date&api_key=wDB09SQODRpVIOvX&response_format=json&suppress_response_codes=true&v=1.0&ts=1536362358137';
	if (jQuery('input[name=instance]').val() == "heartdev") {
		apiURL = 'https://dev2.heart.org/site/CRTeamraiserAPI?luminateExtend=1.7.1&method=getTeamraisersByInfo&name=%25%25%25&list_filter_column=frc.fr_id&list_filter_text='+evid+'&list_page_size=500&list_ascending=false&list_sort_column=event_date&api_key=wDB09SQODRpVIOvX&response_format=json&suppress_response_codes=true&v=1.0&ts=1536362358137';
	}
	jQuery.getJSON(apiURL,function(data){
		if(data.getTeamraisersResponse != null) {
                   var regtst = /\w{3}-+/;
	   	   var match = regtst.exec(data.getTeamraisersResponse.teamraiser.greeting_url);
                   if (match != null) {
   		      jQuery('input[name=affiliate]').val(match[0].substr(0,3));
                   } else {
   		      jQuery('input[name=affiliate]').val('GEN');
                   }
                } else {
		   jQuery('input[name=affiliate]').val('GEN');
                }
        });
	    
	/* UI handlers for the donation form example */
        if (jQuery('.donation-form').length > 0) {
            jQuery('.donate-select label').click(function() {
                if (jQuery(this).next('div').is('.level-other-input')) {
                    jQuery('.level-other-input').slideDown();
                    jQuery('#other-amount-entered').removeAttr('disabled');
                    jQuery('#other-amount-entered').attr('name', 'other_amount_entered');
                    jQuery('#other-amount-entered').focus();
                } else {
                    jQuery('.level-other-input').slideUp();
                    jQuery('#other-amount-entered').attr('disabled', 'disabled');
                    jQuery('#other-amount-entered').removeAttr('name');
                }
            });

            jQuery('.donation-form').submit(function() {
                //move contact info details to billing info if any fields are blank
                jQuery('[id^=billing\\_]').each(function() {
                    if (jQuery(this).val() == "") {
                        jQuery(this).val(jQuery("[id='" + jQuery(this).attr("id").replace("billing_", "donor_") + "']").val());
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
                var form = jQuery('form.donation-form');
                jQuery(form).validate().settings.ignore = ":disabled,:hidden";
                if (jQuery(form).valid()) {
                    if (jQuery('input[name=other_amount]').val() < 10) {
                        alert("Please enter an amount $10 or greater");
                        return false;
                    }
                    var venmoData = "Donate to the American Heart Association";
					venmoData += "<div style='font-size:40px'>$" + jQuery('input[name=other_amount]').val() + "</div>";
					jQuery('#venmoModal .modal-body').html(venmoData);
					jQuery('#venmoModal').modal('show'); 
		    		return true;
                } else {
                    jQuery('label.error').attr('role','alert').attr('aria-atomic','true');
                    return false;
                }
            });
        }

    });

(function($) {
    jQuery.extend({
        getQuerystring: function(name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(location.href);
            if (results == null)
                return "";
            else
                return decodeURIComponent(results[1].replace(/\+/g, " "));
        }
    });
})(jQuery);

function submitToVenmo() {
	window.scrollTo(0, 300);
	jQuery('#venmoModal').modal('hide');
	jQuery('.donation-form').hide();
	jQuery('.processing').show();
	braintree_aha.submitVenmoDonation();
}
function donateVenmo() {
	window.scrollTo(0, 0);
	jQuery('.donation-form').hide();
	jQuery('.processing').hide();
	var amt = jQuery('input[name=other_amount]').val();
	var feeamt = jQuery('input[name=additional_amount]').val();
	var originalamt = jQuery('input[name=gift_amount]').val();
	var ref = 'VENMO:'+jQuery('input[name=processorAuthorizationCode]').val();
	//save off venmo id into custom field
	jQuery('input[name=check_number]').val(ref);
	jQuery('input[name=payment_confirmation_id]').val(ref);
	jQuery('input[name=gift_display_name]').val(jQuery('input[name="first_name"]').val() + ' ' + jQuery('input[name="last_name"]').val());

	//make offline donation in luminate to record transaction
	if (jQuery('input[name="df_preview"]').val() != "true") donateOffline(donateOfflineCallback);

	//var amt = data.donationResponse.donation.amount.decimal;
	var from_url = jQuery('input[name="from_url"]').val();
	var email = jQuery('input[name="email"]').val();
	var first = jQuery('input[name="first_name"]').val();
	var last = jQuery('input[name="last_name"]').val();
	var street1 = jQuery('input[name="street1"]').val();
	var street2 = jQuery('input[name="street2"]').val();
	var city = jQuery('input[name="city"]').val();
	var state = jQuery('select[name="state"]').val();
	var zip = jQuery('input[name="zip"]').val();
	var venmouser = jQuery('input[name="venmo_user"]').val();

	jQuery('.donation-loading').remove();
	jQuery('.donate-now, .header-donate').hide();
	jQuery('.thank-you').show();
	var ty_url = "/amazonpay/ym-primary/venmo/thankyou.html";
	jQuery.get(ty_url, function(datat) {
		jQuery('.thank-you').html(jQuery(datat).find('.thank-you').html());
		jQuery('p.from_url').html("<a href='"+from_url+"'>Click here</a>");
		jQuery('p.first').html(first);
		jQuery('p.last').html(last);
		jQuery('p.street1').html(street1);
		jQuery('p.street2').html(street2);
		jQuery('p.city').html(city);
		jQuery('p.state').html(state);
		jQuery('p.zip').html(zip);
		jQuery('p.email').html(email);
		jQuery('p.amount').html("$" + amt);
		jQuery('p.fee-amount').html("$" + feeamt);
		jQuery('p.original-amount').html("$" + originalamt);
		jQuery('p.confcode').html(ref);
		jQuery('p.venmouser').html(venmouser);
		jQuery('.share-url a').each(function(){
			jQuery(this).attr("href", jQuery(this).attr("href").replace("%returnurl%",escape(from_url)));
		});
	});

	/* ECOMMERCE TRACKING CODE */
	ga('require', 'ecommerce');
	ga('ecommerce:addTransaction', {
		'id': ref,
		'affiliation': 'AHA Venmo Donation',
		'revenue': amt,
		'city': jQuery('input[name="donor.address.city"]').val(),
		'state': jQuery('select[name="donor.address.state"]').val() // local currency code.
	});
	ga('ecommerce:send');
	ga('send', 'pageview', '/donateok.asp');
}

//copy donor fields to billing
jQuery('[id^=donor_]').each(function() {
    jQuery(this).blur(function() {
        jQuery("[id='" + jQuery(this).attr("id").replace("donor_", "billing_") + "']").val(jQuery(this).val());
    });
});
