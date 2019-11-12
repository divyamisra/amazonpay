(function($) {
    jqcn.extend({
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
})(jqcn);

jqcn(document).ready(function() {
	jqcn('#from_url_js').val(document.referrer);
	    
        var evid = jqcn.getQuerystring("FR_ID");
	jqcn.getJSON('https://hearttools.heart.org/aha_2014/getEventDetail.php?event_id='+evid+'&callback=?',function(data){
		if(data.eventdata != null) {
                   var regtst = /\w{3}-+/;
	   	   var match = regtst.exec(data.eventdata.greetingurl);
                   if (match != null) {
   		      jqcn('input[name=affiliate]').val(match[0].substr(0,3));
                   } else {
   		      jqcn('input[name=affiliate]').val('GEN');
                   }
                } else {
		   jqcn('input[name=affiliate]').val('GEN');
                }
	});
	    
	/* UI handlers for the donation form example */
        if (jqcn('.donation-form').length > 0) {
            jqcn('.donate-select label').click(function() {
                if (jqcn(this).next('div').is('.level-other-input')) {
                    jqcn('.level-other-input').slideDown();
                    jqcn('#other-amount-entered').removeAttr('disabled');
                    jqcn('#other-amount-entered').attr('name', 'other_amount_entered');
                    jqcn('#other-amount-entered').focus();
                } else {
                    jqcn('.level-other-input').slideUp();
                    jqcn('#other-amount-entered').attr('disabled', 'disabled');
                    jqcn('#other-amount-entered').removeAttr('name');
                }
            });

            jqcn('.donation-form').submit(function() {
                //move contact info details to billing info if any fields are blank
                jqcn('[id^=billing\\_]').each(function() {
                    if (jqcn(this).val() == "") {
                        jqcn(this).val(jqcn("[id='" + jqcn(this).attr("id").replace("billing_", "donor_") + "']").val());
                    }
                });

                jqcn('input[name=compliance]').val("true");

                window.scrollTo(0, 0);
                jqcn(this).hide();
                jqcn(this).before('<div class="well donation-loading">' +
                    'Thank You!  We are now processing your gift ...' +
                    '</div>');
            });

            jqcn('.donation-form').validate();

            jqcn.validator.addMethod(
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

            jqcn('#donate-submit').click(function() {
                var form = jqcn('form.donation-form');
                jqcn(form).validate().settings.ignore = ":disabled,:hidden";
                if (jqcn(form).valid()) {
                    if (jqcn('input[name=other_amount]').val() < 25) {
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


function donateApplePay() {
	window.scrollTo(0, 0);
	jqcn('.donation-form').hide();
	var params = jqcn('.donation-form').serialize();
	var status = "";
	var amt = jqcn('input[name=other_amount]').val();
	var feeamt = jqcn('input[name=additional_amount]').val();
	var originalamt = jqcn('input[name=gift_amount]').val();
	// reset field to post correct value back to LO
	jqcn('input[name=gift_amount]').val(amt);
	var ref = 'APPLEPAY:'+jqcn('input[name=processorAuthorizationCode]').val();
	//save off amazon id into custom field
	jqcn('input[name=check_number]').val(ref);
	jqcn('input[name=payment_confirmation_id]').val(ref);
	jqcn('input[name=gift_display_name]').val(jqcn('input[name="first_name"]').val() + ' ' + jqcn('input[name="last_name"]').val());

	//make offline donation in luminate to record transaction
	if (jqcn('input[name="df_preview"]').val() != "true") donateOffline();

	//var amt = data.donationResponse.donation.amount.decimal;
	var from_url = jqcn('input[name="from_url"]').val();
	var email = jqcn('input[name="email"]').val();
	var first = jqcn('input[name="first_name"]').val();
	var last = jqcn('input[name="last_name"]').val();
	var full = jqcn('input[name="first_name"]').val() + ' ' + jqcn('input[name="last_name"]').val();
	var street1 = jqcn('input[name="street1"]').val();
	var street2 = jqcn('input[name="street2"]').val();
	var city = jqcn('input[name="city"]').val();
	var state = jqcn('select[name="state"]').val();
	var zip = jqcn('input[name="zip"]').val();
	//var country = jqcn('select[name="country"]').val();
	//var ref = data.donationResponse.donation.confirmation_code;

	jqcn('.donation-loading').remove();
	jqcn('.donate-now, .header-donate').hide();
	jqcn('.thank-you').show();
	var ty_url = "https://www2.heart.org/amazonpay/heartwalk/applepay/thankyou.html";
	if (jqcn('input[name=instance]').val() == "heartdev") {
		ty_url = "https://secure3.convio.net/heartdev/amazonpay/heartwalk/applepay/thankyou.html";
	}
	jqcn.get(ty_url, function(datat) {
		jqcn('.thank-you').html(jqcn(datat).find('.thank-you').html());
		jqcn('p.from_url').html("<a href='"+from_url+"'>Click here</a>");
		jqcn('p.first, span.first').html(first);
		jqcn('p.last').html(last);
		jqcn('p.street1').html(street1);
		jqcn('p.street2').html(street2);
		jqcn('p.city').html(city);
		jqcn('p.state').html(state);
		jqcn('p.zip').html(zip);
		//jqcn('p.country').html(country);
		jqcn('p.email').html(email);
		jqcn('p.fee-amount').html("$" + feeamt);
		jqcn('p.original-amount').html("$" + originalamt);
		jqcn('p.amount').html("$" + amt);
		jqcn('p.confcode').html(ref);
	});

	/* ECOMMERCE TRACKING CODE */
	ga('require', 'ecommerce');

	ga('ecommerce:addTransaction', {
		'id': ref,
		'affiliation': 'AHA ApplePay Donation',
		'revenue': amt,
		'city': jqcn('input[name="donor.address.city"]').val(),
		'state': jqcn('select[name="donor.address.state"]').val() // local currency code.
	});

	ga('ecommerce:send');

	ga('send', 'pageview', '/donateok.asp');
}

function donateOffline() {
	var params = jqcn('.donation-form').serialize();

	jqcn.ajax({
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
jqcn('[id^=donor_]').each(function() {
    jqcn(this).blur(function() {
        jqcn("[id='" + jqcn(this).attr("id").replace("donor_", "billing_") + "']").val(jqcn(this).val());
    });
});

var eid = jqcn('input[name=fr_id]').val();
var dtype = (jqcn('input[name=proxy_type_value]').val() == 20 || jqcn('input[name=proxy_type_value]').val() == 2) ? "p" : ((jqcn('input[name=proxy_type_value]').val() == 21) ? "e" : "t");
var pid = (dtype == "p") ? jqcn('input[name=cons_id]').val() : "";
var tid = (dtype == "t") ? jqcn('input[name=team_id]').val() : "";
	var tr_info = "https://www2.heart.org/site/SPageNavigator/reus_donate_amazon_tr_info.html";
	if (jqcn('input[name=instance]').val() == "heartdev") {
	tr_info = "https://secure3.convio.net/heartdev/site/SPageNavigator/reus_donate_amazon_tr_info.html";
}
jqcn.getJSON(tr_info+"?pgwrap=n&fr_id="+eid+"&team_id="+tid+"&cons_id="+pid+"&callback=?",function(data2){
	//jqcn('.page-header h1').html(data2.event_title);
	if (data2.team_name != "" && dtype == "t") {
		jqcn('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Team Name:</strong><br/><a href="'+jqcn('input[name=from_url]').val()+'">'+data2.team_name+'</a></div>');
	}
	if (data2.event_title != " " && dtype == "e") {
		jqcn('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Event:</strong><br/><a href="'+jqcn('input[name=from_url]').val()+'">'+data2.event_title+'</a></div>');
	}
	if (data2.part_name != " " && dtype == "p") {
		jqcn('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Participant:</strong><br/><a href="'+jqcn('input[name=from_url]').val()+'">'+data2.part_name+'</a></div>');
	}

	jqcn('input[name=form_id]').val(data2.don_form_id);
});

// Get amount passed from query string
var amount = jqcn.getQuerystring("amount");
if (amount.length > 0) {
	var match = jqcn('label[data-amount=' + amount + ']');
	if(match.length>=1){
		jqcn(match).click();
		coverFee();
	} else {
		jqcn('label.active').removeClass("active");
		jqcn('label.level_other').addClass("active");
		jqcn('.level-other-input').slideDown();
		jqcn('#other-amount-entered').removeAttr('disabled');
		jqcn('#other-amount-entered').attr('name', 'other_amount_entered');
		jqcn('input[name=other_amount], input[name=gift_amount], input[name=other_amount_entered]').val(amount);
		coverFee();
	}
}


//Calculate fee amount
function calculateFee() {
	// get amount from hidden field 
	// var amt = parseInt(jqcn('input[name=gift_amount]').val().replace('$',''));
	var amt = parseFloat(jqcn('input[name=gift_amount]').val());
	// formula amt * 2.9% + .29
	var fee = ((amt * .029) + .29).toFixed(2);
  
	return fee;
}
  
function setGiftAmount() {
	var amt = jqcn('input[name=gift_amount]').val();
	var fee = jqcn('input[name=additional_amount]').val();
	
	jqcn('input[name=other_amount]').val(parseFloat(amt) + parseFloat(fee));
}
  
function formatCurrency(amt) {
	return amt.replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function setDisplayAmount() {
	jqcn('#confirmationAmt').text(jqcn('input[name=other_amount]').val());
}

function coverFee() {
	// run additional calculation
	if(jqcn('#cover_fee').prop('checked')){
		jqcn('input[name=additional_amount]').val(calculateFee());
	} else {
		jqcn('input[name=additional_amount]').val(0);
	} 

	setGiftAmount();
	setDisplayAmount();
}

jqcn('#other-amount-entered').on('blur', function(){
	coverFee();
})
jqcn('#cover_fee, .radio-level').on('click', function(){
	coverFee();
});
