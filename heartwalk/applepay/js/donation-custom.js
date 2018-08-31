    jQuery(document).ready(function() {

        /* UI handlers for the donation form example */
        if (jQuery('.donation-form').length > 0) {
		var eid = jQuery('input[name=fr_id]').val();
		var dtype = (jQuery('input[name=proxy_type_value]').val() == 20) ? "p" : ((jQuery('input[name=proxy_type_value]').val() == 21) ? "e" : "t");
		var pid = (dtype == "p") ? jQuery('input[name=cons_id]').val() : "";
		var tid = (dtype == "t") ? jQuery('input[name=team_id]').val() : "";
		var tr_info = "https://www2.heart.org/site/SPageNavigator/reus_donate_amazon_tr_info.html";
		if (jQuery('input[name=instance]').val() == "heartdev") {
			tr_info = "https://secure3.convio.net/heartdev/site/SPageNavigator/reus_donate_amazon_tr_info.html";
		}
		jQuery.getJSON(tr_info + "?pgwrap=n&fr_id=" + eid + "&team_id=" + tid + "&cons_id=" + pid + "&callback=?", function(data2) {
			//jQuery('.page-header h1').html(data2.event_title);
			if (data2.team_name != "" && dtype == "t") {
				jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Team Name:</strong><br/><a href="' + jQuery('input[name=from_url]').val() + '">' + data2.team_name + '</a></div>');
			}
			if (data2.part_name != " " && dtype == "p") {
				jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Participant:</strong><br/><a href="' + jQuery('input[name=from_url]').val() + '">' + data2.part_name + '</a></div>');
			}
			jQuery('input[name=form_id]').val(data2.don_form_id);
		});

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
	$('.donation-form').hide();
	var params = $('.donation-form').serialize();
	var status = "";
	var amt = $('input[name=other_amount]').val();
	var ref = $('input[name=processorAuthorizationCode]').val();
	//save off amazon id into custom field
	$('input[name=check_number]').val(ref);
	$('input[name=payment_confirmation_id]').val(ref);

	//make offline donation in luminate to record transaction
	if ($('input[name="df_preview"]').val() != "true") donateOffline();

	//var amt = data.donationResponse.donation.amount.decimal;
	var email = $('input[name="donor.email"]').val();
	var first = $('input[name="donor.name.first"]').val();
	var last = $('input[name="donor.name.last"]').val();
	var full = $('input[name="donor.name.first"]').val() + ' ' + $('input[name="donor.name.last"]').val();
	var street1 = $('input[name="donor.address.street1"]').val();
	var street2 = $('input[name="donor.address.street2"]').val();
	var city = $('input[name="donor.address.city"]').val();
	var state = $('select[name="donor.address.state"]').val();
	var zip = $('input[name="donor.address.zip"]').val();
	var country = $('select[name="donor.address.country"]').val();
	//var ref = data.donationResponse.donation.confirmation_code;
	var cdate = $('select[name="card_exp_date_month"]').val() + "/" + $('select[name="card_exp_date_year"]').val();
	var cc = $('input[name=card_number]').val();
	var ctype = $('input[name=card_number]').attr("class").replace(" valid", "").toUpperCase();

	$('.donation-loading').remove();
	$('.donate-now, .header-donate').hide();
	$('.thank-you').show();
	var ty_url = "https://www2.heart.org/amazonpay/heartwalk/applepay/thankyou.html";
	if (jQuery('input[name=instance]').val() == "heartdev") {
		ty_url = "https://secure3.convio.net/heartdev/amazonpay/heartwalk/applepay/thankyou.html";
	}
	$.get(ty_url, function(datat) {
		$('.thank-you').html($(datat).find('.thank-you').html());
		$('p.first').html(first);
		$('p.last').html(last);
		$('p.street1').html(street1);
		$('p.street2').html(street2);
		$('p.city').html(city);
		$('p.state').html(state);
		$('p.zip').html(zip);
		$('p.country').html(country);
		$('p.email').html(email);
		$('tr.cardGroup').hide();
		$('tr.amazon').show();
		$('p.amount').html("$" + amt);
		$('p.confcode').html(ref);
	});

	/* ECOMMERCE TRACKING CODE */
	ga('require', 'ecommerce');

	ga('ecommerce:addTransaction', {
		'id': ref,
		'affiliation': 'AHA ApplePay Donation',
		'revenue': amt,
		'city': $('input[name="donor.address.city"]').val(),
		'state': $('select[name="donor.address.state"]').val() // local currency code.
	});

	ga('ecommerce:send');

	ga('send', 'pageview', '/donateok.asp');
}

function donateOffline() {
	var params = $('.donation-form').serialize();

	$.ajax({
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
