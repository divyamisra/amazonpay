    jQuery(document).ready(function() {

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
                    if (value == 0 || (value >= 25 && value <= 500)) {
                        return true;
                    } else {
                        return false;
                    }
                },
                "Please enter an amount between $25 and $500"
            );

            jQuery('#donate-submit').click(function() {
                var form = jQuery('form.donation-form');
                jQuery(form).validate().settings.ignore = ":disabled,:hidden";
                if (jQuery(form).valid()) {
                    if (jQuery('input[name=other_amount]').val() < 25) {
                        alert("Please enter an amount $25 or greater");
                        return false;
                    }
                    braintree_aha.submitApplePayDonation();
                } else {
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

function donateApplePay() {
	window.scrollTo(0, 0);
	jQuery('.donation-form').hide();
	var params = jQuery('.donation-form').serialize();
	var status = "";
	var amt = jQuery('input[name=other_amount]').val();
	var ref = jQuery('input[name=processorAuthorizationCode]').val();
	//save off amazon id into custom field
	jQuery('input[name=check_number]').val(ref);
	jQuery('input[name=payment_confirmation_id]').val(ref);

	//make offline donation in luminate to record transaction
	if (jQuery('input[name="df_preview"]').val() != "true") donateOffline();

	//var amt = data.donationResponse.donation.amount.decimal;
	var email = jQuery('input[name="donor.email"]').val();
	var first = jQuery('input[name="donor.name.first"]').val();
	var last = jQuery('input[name="donor.name.last"]').val();
	var full = jQuery('input[name="donor.name.first"]').val() + ' ' + jQuery('input[name="donor.name.last"]').val();
	var street1 = jQuery('input[name="donor.address.street1"]').val();
	var street2 = jQuery('input[name="donor.address.street2"]').val();
	var city = jQuery('input[name="donor.address.city"]').val();
	var state = jQuery('select[name="donor.address.state"]').val();
	var zip = jQuery('input[name="donor.address.zip"]').val();
	var country = jQuery('select[name="donor.address.country"]').val();
	//var ref = data.donationResponse.donation.confirmation_code;
	var cdate = jQuery('select[name="card_exp_date_month"]').val() + "/" + jQuery('select[name="card_exp_date_year"]').val();
	//var cc = jQuery('input[name=card_number]').val();
	//var ctype = jQuery('input[name=card_number]').attr("class").replace(" valid", "").toUpperCase();

	jQuery('.donation-loading').remove();
	jQuery('.donate-now, .header-donate').hide();
	jQuery('.thank-you').show();
	var ty_url = "https://www2.heart.org/amazonpay/heartwalk/applepay/thankyou.html";
	if (jQuery('input[name=instance]').val() == "heartdev") {
		ty_url = "https://secure3.convio.net/heartdev/amazonpay/heartwalk/applepay/thankyou.html";
	}
	jQuery.get(ty_url, function(datat) {
		jQuery('.thank-you').html(jQuery(datat).find('.thank-you').html());
		jQuery('p.first').html(first);
		jQuery('p.last').html(last);
		jQuery('p.street1').html(street1);
		jQuery('p.street2').html(street2);
		jQuery('p.city').html(city);
		jQuery('p.state').html(state);
		jQuery('p.zip').html(zip);
		jQuery('p.country').html(country);
		jQuery('p.email').html(email);
		jQuery('tr.cardGroup').hide();
		jQuery('tr.amazon').show();
		jQuery('p.amount').html("$" + amt);
		jQuery('p.confcode').html(ref);
	});

	/* ECOMMERCE TRACKING CODE */
	ga('require', 'ecommerce');

	ga('ecommerce:addTransaction', {
		'id': ref,
		'affiliation': 'AHA ApplePay Donation',
		'revenue': amt,
		'city': jQuery('input[name="donor.address.city"]').val(),
		'state': jQuery('select[name="donor.address.state"]').val() // local currency code.
	});

	ga('ecommerce:send');

	ga('send', 'pageview', '/donateok.asp');
}

function donateOffline() {
	var params = jQuery('.donation-form').serialize();

	jQuery.ajax({
		method: "POST",
		async: false,
		cache: false,
		dataType: "json",
		url: "https://hearttools.heart.org/donate/convio-offline/addOfflineDonation-tr.php?" + params + "&callback=?",
		success: function(data) {
			//donateCallback.success(data.data);
		}
	});

}

//copy donor fields to billing
jQuery('[id^=donor_]').each(function() {
    jQuery(this).blur(function() {
        jQuery("[id='" + jQuery(this).attr("id").replace("donor_", "billing_") + "']").val(jQuery(this).val());
    });
});