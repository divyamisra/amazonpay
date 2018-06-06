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

//
if (location.href.indexOf("donate_amazon") > 0) {
 
	var eid = jQuery('input[name=fr_id]').val();
	var dtype = (jQuery('input[name=proxy_type_value]').val() == 20) ? "p" : ((jQuery('input[name=proxy_type_value]').val() == 21) ? "e" : "t");
	var pid = (dtype == "p") ? jQuery('input[name=cons_id]').val() : "";
	var tid = (dtype == "t") ? jQuery('input[name=team_id]').val() : "";
    	var tr_info = "https://www2.heart.org/site/SPageNavigator/reus_donate_amazon_tr_info.html";
    	if (jQuery('input[name=instance]').val() == "heartdev") {
		tr_info = "https://secure3.convio.net/heartdev/site/SPageNavigator/reus_donate_amazon_tr_info.html";
	}
	jQuery.getJSON(tr_info+"?pgwrap=n&fr_id="+eid+"&team_id="+tid+"&cons_id="+pid+"&callback=?",function(data2){
		//jQuery('.page-header h1').html(data2.event_title);
		if (data2.team_name != "" && dtype == "t") {
			jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Team Name:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.team_name+'</a></div>');
		}
		if (data2.part_name != " " && dtype == "e") {
			jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Event:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.event_title+'</a></div>');
		}
		if (data2.part_name != " " && dtype == "p") {
			jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Participant:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.part_name+'</a></div>');
		}

		jQuery('input[name=form_id]').val(data2.don_form_id);
		//jQuery.getJSON("https://secure3.convio.net/heartdev/site/CRDonationAPI?v=1.0&api_key=wDB09SQODRpVIOvX&response_format=json&suppress_response_codes=true&method=getDonationFormInfo&form_id="+data2.don_form_id+"&fr_id="+eid,function(data3){
		//	jQuery.each(data3.getDonationFormInfoResponse.donationLevels,function(i, levels){
		//		jQuery.each(levels,function(){
		//			if (this.name == "Donor Entered Amount") {
		//				jQuery('input[name=level_id]').val(this.level_id);
		//			}
		//		});
		//	});
		//});
	});

}
