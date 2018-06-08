(function($) {
  /* define init variables for your organization */
  jqcn(function() {
    
    /* UI handlers for the donation form example */
    if(jqcn('.donation-form').length > 0) {
      jqcn('.donate-select label').click(function() {
        if(jqcn(this).next('div').is('.level-other-input')) {
			jqcn('.level-other-input').slideDown();
          jqcn('#other-amount-entered').removeAttr('disabled');
          jqcn('#other-amount-entered').attr('name', 'other_amount_entered');
          jqcn('#other-amount-entered').focus();
        }
        else {
			jqcn('.level-other-input').slideUp();			
          jqcn('#other-amount-entered').attr('disabled', 'disabled');
          jqcn('#other-amount-entered').removeAttr('name');
        }
      });
      
	  jqcn('.gift-select label').click(function(){
			showLevels(jqcn(this).prev('input').data('frequency'),this);
  	  });

      jqcn('.donation-form').submit(function() {
		//move contact info details to billing info if any fields are blank
		jqcn('[id^=billing\\_]').each(function(){
		  if (jqcn(this).val() == ""){
			   jqcn(this).val(jqcn("[id='"+jqcn(this).attr("id").replace("billing_","donor_")+"']").val());
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
		var form =jqcn('form.donation-form');
		jqcn(form).validate().settings.ignore = ":disabled,:hidden";
		if (jqcn(form).valid()) {
			if (jqcn('input[name=other_amount]').val() < 25) {
				alert("Please enter an amount $25 or greater");
				return false;
			}
			if (typeof amazon.Login.AmazonBillingAgreementId != "undefined") {
				if (jqcn('label[for="type-monthly"] .active').length > 0) {				
					if (amazon.Login.MODBuyerBillingAgreementConsentStatus === "true") {
						donateAmazon();
					} else {
						alert("Consent is needed before making donation");
					}
				} else {
					donateAmazon();					
				}
			} else {
				alert("Please login to Amazon and select payment before submitting");
				return false;
			}
		} else { 
			return false;
		}
      });
    }

	function donateAmazon() {
		window.scrollTo(0, 0);
		jqcn('.donation-form').hide();
		jqcn('.donation-form').before('<div class="well donation-loading">' + 
						 'Thank You!  We are now processing your donation using Amazon ...' + 
					   '</div>');
		var params = jqcn('.donation-form').serialize();
		var amazonErr = false;
		var status = "";
		var amt = 0;
		var ref = 0;
		
		jqcn.ajax({
			method: "POST",
			async: false,
			cache:false,
			dataType: "json",
			url:"https://hearttools.heart.org/donate/amazon/payWithAmazon.php?"+params+"&callback=?",
			success: function(data){
				if (jqcn('input[name=recurring]').val() == "true") {
					status = data.data.AuthorizeOnBillingAgreementResult.AuthorizationDetails.AuthorizationStatus.State;
					amt = data.data.AuthorizeOnBillingAgreementResult.AuthorizationDetails.CapturedAmount.Amount;
					ref = data.data.AuthorizeOnBillingAgreementResult.AuthorizationDetails.AmazonAuthorizationId;
					
					if (status != "Closed") {
						amazonErr = true;
					}
				} else {
					status = data.data.AuthorizeResult.AuthorizationDetails.AuthorizationStatus.State;
					amt = data.data.AuthorizeResult.AuthorizationDetails.CapturedAmount.Amount;
					ref = data.data.AuthorizeResult.AuthorizationDetails.AmazonAuthorizationId;
					
					if (status != "Closed") {
						amazonErr = true;
					}
				}

				if (amazonErr) {
					jqcn('#donation-errors').append('<div class="alert alert-danger">' + data.data.toString() + '</div>');	
			
					jqcn('.donation-loading').remove();
					jqcn('.donation-form').show();				
				} else {
					//save off amazon id into custom field
					jqcn('input[name=payment_confirmation_id]').val(ref);
					
					//logout of amazon
					amazon.Login.logout();
					
					//make offline donation in luminate to record transaction
					//if (jqcn('input[name="df_preview"]').val() != "true") 
					donateOffline();
					
					//var amt = data.donationResponse.donation.amount.decimal;
					var email = jqcn('input[name="email"]').val();
					var first = jqcn('input[name="first_name"]').val();
					var last = jqcn('input[name="last_name"]').val();
					var full = jqcn('input[name="first_name"]').val()+' '+jqcn('input[name="last_name"]').val();
					var street1 = jqcn('input[name="street1"]').val();
					var street2 = jqcn('input[name="street2"]').val();
					var city = jqcn('input[name="city"]').val();
					var state = jqcn('select[name="state"]').val();
					var zip = jqcn('input[name="zip"]').val();
					//var ref = data.donationResponse.donation.confirmation_code;
					var from_url = jqcn('input[name="from_url"]').val();
					
				  jqcn('.donation-loading').remove();
				  jqcn('.donate-now, .header-donate').hide();
				  jqcn('.thank-you').show();
				  var ty_url = "https://www2.heart.org/amazonpay/cyclenation/amazon/thankyou.html";
				  if (jqcn('input[name=instance]').val() == "heartdev") {
				  	ty_url = "https://secure3.convio.net/heartdev/amazonpay/cyclenation/amazon/thankyou.html";
				  }
				  jqcn.get(ty_url,function(datat){ 
					  jqcn('.thank-you').html(jqcn(datat).find('.thank-you').html());
					  jqcn('p.first').html(first);
					  jqcn('p.last').html(last);
					  jqcn('p.street1').html(street1);
					  jqcn('p.street2').html(street2);
					  jqcn('p.city').html(city);
					  jqcn('p.state').html(state);
					  jqcn('p.zip').html(zip);
					  jqcn('p.email').html(email);
					  jqcn('tr.card').hide();
					  jqcn('tr.amazon').show();
					  jqcn('p.amount').html("$"+amt);
					  jqcn('p.confcode').html(ref);
					  jqcn('p.from_url').html("<a href='"+from_url+"'>Return</a>");
					  jqcn('.share-url').each(function(){
						jqcn(this).attr("href",jqcn(this).attr("href").replace("%returnurl%",escape(from_url)));
					  });
					});
							  
				}
			}
		});

	}

	function donateOffline() {
		var params = jqcn('.donation-form').serialize();

		jqcn.ajax({
			method: "POST",
			async: false,
			cache:false,
			dataType: "json",
			url:"https://hearttools.heart.org/donate/convio-offline/addOfflineDonation-tr.php?"+params+"&callback=?",
			success: function(data){
				//donateCallback.success(data.data);
			}
		});

	}
  });
})(jqcn);

function showLevels(frequency, sel) {
	jqcn('.radio-label').removeClass("active");
	jqcn(sel).addClass("active");
    jqcn('.donate-select label.radio-level').removeClass("active");
	if (frequency == "recurring") {
		jqcn('.recurring').show();
		jqcn('.onetime').hide();
		jqcn('input[name=recurring]').val('true');
		jqcn("#consentWidgetDiv").show();
	    jqcn('.recurring label.radio-level:eq(1)').click();
	} else {
		jqcn('.recurring').hide();
		jqcn('.onetime').show();
		jqcn('input[name=recurring]').val('false');
		jqcn("#consentWidgetDiv").hide();
	    jqcn('.onetime label.radio-level:eq(1)').click();
	}
}

function getAmazonAddress() {
	var params = jqcn('.donation-form').serialize();
	jqcn.ajax({
		method: "POST",
		async: false,
		cache:false,
		dataType: "json",
		url:"https://hearttools.heart.org/donate/amazon/getAmazonAddress.php?"+params+"&callback=?",
		success: function(data){
			var address = data.data.GetBillingAgreementDetailsResult.BillingAgreementDetails.BillingAddress.PhysicalAddress;
			jqcn('input[name="street1"]').val(address.AddressLine1);
			jqcn('input[name="city"]').val(address.City);
			jqcn('select[name="state"]').val(address.StateOrRegion);
			jqcn('input[name="billing_street1"]').val(address.AddressLine1);
			jqcn('input[name="billing_city"]').val(address.City);
			jqcn('input[name="billing_state"]').val(address.StateOrRegion);
		}
	});
}

(function ($) {
	jqcn.extend({
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
})(jqcn);

//copy donor fields to billing
jqcn('[id^=donor_]').each(function(){
  jqcn(this).blur(function(){
    jqcn("[id='"+jqcn(this).attr("id").replace("donor_","billing_")+"']").val(jqcn(this).val());
  });
});

//autofill from querystring data
jqcn('input[name="first_name"]').val(jqcn.getQuerystring("first"));
jqcn('input[name="last_name"]').val(jqcn.getQuerystring("last"));
jqcn('input[name="street1"]').val(jqcn.getQuerystring("street1"));	
jqcn('input[name="dstreet2"]').val(jqcn.getQuerystring("street2"));	
jqcn('input[name="city"]').val(jqcn.getQuerystring("city"));	
jqcn('input[name="state"]').val(jqcn.getQuerystring("state"));	
jqcn('input[name="zip"]').val(jqcn.getQuerystring("zip"));	
jqcn('input[name="email"]').val(jqcn.getQuerystring("email"));	

//check for any passed parameters
if (jqcn.getQuerystring("s_src")) {
	jqcn('input[name=source]').val(jqcn.getQuerystring("s_src"));
}

if (jqcn.getQuerystring("msource")) {
	jqcn('input[name=source]').val(jqcn.getQuerystring("msource"));
}

if (jqcn.getQuerystring("amount")) {
	jqcn('label.active').removeClass("active");
	jqcn('label.level_other').addClass("active");
	jqcn('.level-other-input').slideDown();
	jqcn('#other-amount-entered').removeAttr('disabled');
	jqcn('#other-amount-entered').attr('name', 'other_amount_entered');
	jqcn('input[name=other_amount]').val(jqcn.getQuerystring("amount"));
	jqcn('input[name=other_amount_entered]').val(jqcn.getQuerystring("amount"));
}

// END QUERY STRING CODE 
