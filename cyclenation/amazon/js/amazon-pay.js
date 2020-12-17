var authRequest;

/** BEGIN AMAZON PAY BUTTON **/
OffAmazonPayments.Button( "AmazonPayButton", "A1ZM7MXG16NQQB", {
	type: "PwA",
	// size: "small",

	// two new parameters
	useAmazonAddressBook: false,
	agreementType: 'BillingAgreement',

	// new callback
	onSignIn: function (contract) {
		amazon.Login.AmazonBillingAgreementId = contract.getAmazonBillingAgreementId();
		jQuery("input[name=AmazonBillingAgreementId]").val(amazon.Login.AmazonBillingAgreementId);		

		// render wallet widget code moved from authorize callback		
		// Wallet Widget for recurring payments
		amazon.Login.MODRenderWalletWidget();
	},
	
	authorization: function() {
		loginOptions = {scope: "profile postal_code payments:widget payments:billing_address", popup:true};
		authRequest = amazon.Login.authorize(loginOptions, function(response) { // Callback after login
			if (response.error) {
				alert('oauth error ' + response.error);
				return;
			}
			
			jQuery("#AmazonLogin").hide();
			jQuery("#AmazonPayButton").hide();
			jQuery("#AmazonLogoutButton").show();
			jQuery("#walletWidgetDiv").show();	
			jQuery("#consentWidgetDiv").show();
			
			// Populate submit form with response.access_token
			jQuery("input[name=AmazonAccessToken]").val(response.access_token);
			
			amazon.Login.retrieveProfile(response.access_token,amazon.Login.MODretrieveProfileCallback); // Retrive Amazon user's profile information
		});
	},
	
	onError: function(error) {
		// your error handling code
	}
} );
/** END AMAZON PAY BUTTON **/

/** BEGIN WALLET WIDGET **/
amazon.Login.MODRenderWalletWidget = function() {
	new OffAmazonPayments.Widgets.Wallet( {
		sellerId: 'A1ZM7MXG16NQQB',
		
		agreementType: "BillingAgreement",
		
		// Bind billing agreement ID
		amazonBillingAgreementId: amazon.Login.AmazonBillingAgreementId,

		onPaymentSelect: function(orderReference) {
			// RENDER CONSENT WIDGET IF MOD RECURRING CHECKBOX CHECKED
			if ( jQuery("input[name=recurring]").val() == "true" ) {
				jQuery("#consentWidgetDiv").show();
			} else {
				jQuery("#consentWidgetDiv").hide();
			}
			
			amazon.Login.MODRenderRecurringPaymentsWidget();

			getAmazonAddress();
			//console.log(amazon.Login.GetBillingAgreementDetails(orderReference));
			//try { btnSubmitDonationFormInit(); } catch (_e) {};
		},
		
		design: {
			designMode: 'responsive'
		},
		
		onError: function(error) {
			alert(error.getErrorCode() + error.getErrorMessage()); // On PROD, log error via AJAX instead of alert
		}
	} ).bind("walletWidgetDiv");
};
/** END WALLET WIDGET **/

/** BEGIN RECURRING PAYMENTS WIDGET **/
amazon.Login.MODRenderRecurringPaymentsWidget = function() {
	new OffAmazonPayments.Widgets.Consent({
		sellerId: 'A1ZM7MXG16NQQB',
		amazonBillingAgreementId: amazon.Login.AmazonBillingAgreementId, 
		design: {
			designMode: 'responsive'
		},
		onReady: function(billingAgreementConsentStatus) { // Called after widget renders
			amazon.Login.MODBuyerBillingAgreementConsentStatus = billingAgreementConsentStatus.getConsentStatus();
			if (amazon.Login.MODBuyerBillingAgreementConsentStatus === "true") {
				jQuery("#amazonSubmit").removeAttr("disabled");
			} else {
				jQuery("#amazonSubmit").attr("disabled","disabled");
			}
		},
		onConsent: function(billingAgreementConsentStatus) {
			amazon.Login.MODBuyerBillingAgreementConsentStatus = billingAgreementConsentStatus.getConsentStatus();
			if (amazon.Login.MODBuyerBillingAgreementConsentStatus === "true") {
				jQuery("#amazonSubmit").removeAttr("disabled");
			} else {
				jQuery("#amazonSubmit").attr("disabled","disabled");
			}
		},
		onError: function(error) {
			// your error handling code
		} }).bind("consentWidgetDiv");
};
/** END RECURRING PAYMENTS WIDGET **/

amazon.Login.MODretrieveProfileCallback = function(response) {
	// For response object see "website-sdk-reference._TTH_.pdf", page 5 (as marked on bottom of page)
	var n = response.profile.Name.split(" ");
	jQuery('input[name="first_name"]').val(n[0]);
	jQuery('input[name="last_name"]').val(n[1]);	
	jQuery('input[name="zip"]').val(response.profile.PostalCode);
	jQuery('input[name="email"]').val(response.profile.PrimaryEmail);	
	jQuery('input[name="billing_first_name"]').val(n[0]);
	jQuery('input[name="billing_last_name"]').val(n[1]);	
	jQuery('input[name="billing_zip"]').val(response.profile.PostalCode);
	jQuery('input[name="gift_display_name"]').val(response.profile.Name);
	jQuery('.contact-information').show();
};

// Handler for clicking on logout
amazon.Login.MODLogoutClickHandler = function() {
	jQuery("#AmazonLogin").show();
	jQuery("#AmazonLogoutButton").hide();	
	jQuery("#walletWidgetDiv").hide();	
	jQuery("#consentWidgetDiv").hide();	
	amazon.Login.logout();
	jQuery("input[name=AmazonBillingAgreementId]").val("");
	jQuery("input[name=AmazonOrderReferenceId]").val("");
	jQuery("input[name=AmazonAccessToken]").val("");
	jQuery("#AmazonPayButton").show();
};


function getAmazonAddress() {
	var params = jqcn('.donation-form').serialize();
	jqcn.ajax({
		method: "POST",
		async: false,
		cache:false,
		dataType: "json",
		url:"https://tools.heart.org/donate/amazon/getAmazonAddress.php?"+params+"&callback=?",
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

function donateAmazonOld() {
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
		url:"https://tools.heart.org/donate/amazon/payWithAmazon.php?"+params+"&callback=?",
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
				jqcn('input[name=payment_confirmation_id]').val('AMAZON:'+ref);
				
				//logout of amazon
				amazon.Login.logout();
				
				//make offline donation in luminate to record transaction
				//if (jqcn('input[name="df_preview"]').val() != "true") 
				donateOffline(donateOfflineCallback);
				
				var email = jqcn('input[name="email"]').val();
				var first = jqcn('input[name="first_name"]').val();
				var last = jqcn('input[name="last_name"]').val();
				var street1 = jqcn('input[name="street1"]').val();
				var street2 = jqcn('input[name="street2"]').val();
				var city = jqcn('input[name="city"]').val();
				var state = jqcn('select[name="state"]').val();
				var zip = jqcn('input[name="zip"]').val();
				var from_url = jqcn('input[name="from_url"]').val();
				
			  jqcn('.donation-loading').remove();
			  jqcn('.donate-now, .header-donate').hide();
			  jqcn('.thank-you').show();
			  var ty_url = "/amazonpay/cyclenation/amazon/thankyou.html";
			//   var ty_url = "https://www2.heart.org/amazonpay/cyclenation/amazon/thankyou.html";
			//   if (jqcn('input[name=instance]').val() == "heartdev") {
			//   	ty_url = "https://secure3.convio.net/heartdev/amazonpay/cyclenation/amazon/thankyou.html";
			//   }
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
				  jqcn('.share-url a').each(function(){
					jqcn(this).attr("href",jqcn(this).attr("href").replace("%returnurl%",escape(from_url)));
				  });
				});
						  
			}
		}
	});

}
