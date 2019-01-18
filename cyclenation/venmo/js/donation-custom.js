
    jqcn(document).ready(function() {
	jqcn('#from_url_js').val(document.referrer);
	    
        var evid = jQuery.getCustomQuerystring(location.href,"FR_ID");
	jqcn.getJSON('CRTeamraiserAPI?luminateExtend=1.7.1&method=getTeamraisersByInfo&name=%25%25%25&list_filter_column=frc.fr_id&list_filter_text='+evid+'&list_page_size=500&list_ascending=false&list_sort_column=event_date&api_key=wDB09SQODRpVIOvX&response_format=json&suppress_response_codes=true&v=1.0&ts=1536362358137',function(data){
		if(data.getTeamraisersResponse != null) {
                   var regtst = /\w{3}-+/;
	   	   var match = regtst.exec(data.getTeamraisersResponse.teamraiser.greeting_url);
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
                    if (jqcn('input[name=other_amount]').val() < 25 ) {
                        alert("Please enter an amount $25 or greater");
                        return false;
                    }
                    var venmoData = "Donate to the American Heart Association";
					venmoData += "<div style='font-size:40px'>$" + jqcn('input[name=other_amount]').val() + "</div>";
					jqcn('#venmoModal .modal-body').html(venmoData);
					jqcn('#venmoModal').modal(); 
                } else {
                    return false;
                }
           });
        }

    });

function submitToVenmo() {
	window.scrollTo(0, 100);
	jqcn('#venmoModal').modal('hide');
	jqcn('.donation-form').hide();
	jqcn('.processing').show();
	braintree_aha.submitVenmoDonation();
}

function donateVenmo() {
	window.scrollTo(0, 0);
	jqcn('.donation-form').hide();
	jqcn('.processing').hide();
	var params = jqcn('.donation-form').serialize();
	var status = "";
	var amt = jqcn('input[name=other_amount]').val();
	var ref = 'VENMO:'+jqcn('input[name=processorAuthorizationCode]').val();
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
	var venmouser = jqcn('input[name="venmo_user"]').val();
	//var country = jQuery('select[name="country"]').val();
	//var ref = data.donationResponse.donation.confirmation_code;
	//var cdate = jQuery('select[name="card_exp_date_month"]').val() + "/" + jQuery('select[name="card_exp_date_year"]').val();
	//var cc = jQuery('input[name=card_number]').val();
	//var ctype = jQuery('input[name=card_number]').attr("class").replace(" valid", "").toUpperCase();

	jqcn('.donation-loading').remove();
	jqcn('.donate-now, .header-donate').hide();
	jqcn('.thank-you').show();
	var ty_url = "/amazonpay/heartwalk/venmo/thankyou.html";
	jqcn.get(ty_url, function(datat) {
		jqcn('.thank-you').html(jqcn(datat).find('.thank-you').html());
		jqcn('p.from_url').html("<a href='"+from_url+"'>"+from_url+"</a>");
		jqcn('p.first').html(first);
		jqcn('p.last').html(last);
		jqcn('p.street1').html(street1);
		jqcn('p.street2').html(street2);
		jqcn('p.city').html(city);
		jqcn('p.state').html(state);
		jqcn('p.zip').html(zip);
		//jQuery('p.country').html(country);
		jqcn('p.email').html(email);
		//jQuery('tr.cardGroup').hide();
		//jQuery('tr.amazon').show();
		jqcn('p.amount').html("$" + amt);
		jqcn('p.confcode').html(ref);
		jqcn('p.venmouser').html(venmouser);
	});

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

if (location.href.indexOf("donate_venmo") > 0) {
 
	var eid = jqcn('input[name=fr_id]').val();
	var dtype = (jqcn('input[name=proxy_type_value]').val() == 20) ? "p" : ((jqcn('input[name=proxy_type_value]').val() == 21) ? "e" : "t");
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
			jqcn('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Student:</strong><br/><a href="'+jqcn('input[name=from_url]').val()+'">'+data2.part_name+'</a></div>');
		}

		jqcn('input[name=form_id]').val(data2.don_form_id);
	});

}
