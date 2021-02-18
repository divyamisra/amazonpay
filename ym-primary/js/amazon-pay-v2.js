// Amazon V2
function isSandbox() {
	if (jQuery("input[name=instance]").val() == 'heartdev' || jQuery("input[name=df_preview]").val()) {
		return true;
	}
	return false;
}

/**
 * Build the URL parameters for the signature request
 */
function buildSignatureParams() {
	let returnUrl = location.href;
	if (returnUrl.indexOf('amazonCheckoutSessionId')>0){
		returnUrl = returnUrl.substring(0, returnUrl.indexOf('amazonCheckoutSessionId')-1);
	}
	returnUrl = returnUrl.replaceAll('&','%26');
	const proxy_type_value = jQuery('#proxy_type_value').val();
	let signParams = "other_amount=" + jQuery('input[name=other_amount]').val();
	signParams += "&fr_id=" + jQuery('input[name=fr_id]').val();
	signParams += "&proxy_type_value=" + proxy_type_value;
	if (proxy_type_value == 22) {
		signParams += "&team_id=" + jQuery('#team_id').val();
	} else if (proxy_type_value == 21) {
		signParams += "&ev_id=" + jQuery('#ev_id').val();
	} else {
		signParams += "&cons_id=" + jQuery('#cons_id').val();
	}
	signParams += "&custom_note=" + jQuery('#campaign_name').val();
	signParams = URLEncode(signParams);
	signParams += "&return_url_js=" + returnUrl;

	return signParams;
}

/**
 * Get the Amazon Pay signature
 * @param {*} amazonPayInitCheckout Callback function to process signature
 */
function getSignature(amazonPayInitCheckout) {
	let params = buildSignatureParams();
	if(isSandbox()) {
		params = 'sandbox=true&' + params;
	}

	jQuery.ajax({
		method: "POST",
		cache:false,
		dataType: "json",
		url: "https://tools.heart.org/donate/amazon/v2/getsignature.php?" + params + "&callback=?",
		success: amazonPayInitCheckout
	});
}

/**
 * Submit to Amazon
 * @param {*} signatureData returned signature
 */
function amazonPayInitCheckout(signatureData) {
	let payload = signatureData.payload;
	let signature = signatureData.signature;

	// localStorage.setItem('amz_aha_signature', signature);
	localStorage.setItem('amz_aha_amt', jQuery('input[name=other_amount]').val());

	amazonPayButton.initCheckout({
		createCheckoutSessionConfig: {
		payloadJSON: JSON.stringify(payload),
		signature: signature,
		publicKeyId: 'AEO5HN4OQCCDG4JLTOW6WQF3'
		}
	});
}

/**
 * Verify payment status and display appropriate message
 * @param {*} amazonCheckoutSessionId returned checkout session id
 * @param {*} amzAmt donation amount
 */
function amazonPayVerifyCheckout(amazonCheckoutSessionId, amazonAmount) {
	let params = "amazonCheckoutSessionId=" + amazonCheckoutSessionId + "&amount=" + amazonAmount;
	if(isSandbox()) {
		params = 'sandbox=true&' + params;
	}
	params = URLEncode(params);

	jQuery.ajax({
		method: "POST",
		cache: false,
		dataType: "json",
		url: "https://tools.heart.org/donate/amazon/v2/checkout.php?" + params + "&callback=?",
		success: function(data) {
			console.log(data);

			if (data.status != 200) {
				// handle error
				let errorMessage = 'Your payment was not successful. Please try another payment method.';
				jQuery('#donation-errors').remove();
				jQuery('.donation-form').prepend('<div id="donation-errors" role="alert" aria-atomic="true" aria-live="assertive">' +
						'<div class="alert alert-danger">' +
						errorMessage +
						'</div></div>');
				jQuery('.donation-loading').remove();
				jQuery('.donation-form').show();
			} else {
				//save off amazon id into custom field
				jQuery('input[name=check_number]').val(data.response.chargePermissionId);
				jQuery('input[name=payment_confirmation_id]').val('AMAZON:'+data.response.chargePermissionId);
				// reset field to post correct value back to LO
				jQuery('input[name=gift_amount]').val(jQuery('input[name=other_amount]').val());
				jQuery('input[name=gift_display_name]').val(jQuery('input[name="first_name"]').val() + ' ' + jQuery('input[name="last_name"]').val());
				donateOffline(donateOfflineCallback);
				showConfirmationPage();
				clearStorage();
			}
			
		},
		error: function(data) {
			// General API Error
			console.log(data.response);
			jQuery('#donation-errors').remove();
			jQuery('.donation-form').prepend(`<div id="donation-errors" role="alert" aria-atomic="true" aria-live="assertive"><div class="alert alert-danger">Your payment was not successful. Please try another payment method.</div></div>`);
			jQuery('.donation-loading').remove();
			jQuery('.donation-form').show();
		}
	});
}

/**
 * Re-populate from localStorage
 * @param {*} lsForm string of saved form values
 */
function populateForm(lsForm) {
	// build array of saved data
	let donateData = {};
	const formPairs = lsForm.split("&");
	for(let key in formPairs) {
		donateData[formPairs[key].split("=")[0]] = formPairs[key].split('=')[1];
	}
	// populate inputs
	jQuery('.donation-form input').not('input:checkbox, input:radio').each(function(){
		jQuery(this).val(decodeURI(donateData[this.name]).replace('%40', '@').replaceAll('+', ' ').replaceAll('%2B', ' ').replaceAll('%3A', ':').replaceAll('%2C', ',').replaceAll('%26', '&'));
	});
	// populate selects
	jQuery('.donation-form select').each(function(){
		jQuery(this).val(donateData[this.name]);
	});
	// populate checkboxs
	jQuery('.donation-form input:checkbox').each(function(){
		if(donateData[this.name]){
			jQuery(this).prop('checked', true);
		}
	});
	// reset gift amount
	populateAmount(donateData['other_amount'] - donateData['additional_amount']);
}

/**
 * Populate and display the confirmation page
 */
function showConfirmationPage() {
	const email = jQuery('input[name="email"]').val();
	const first = jQuery('input[name="first_name"]').val();
	const last = jQuery('input[name="last_name"]').val();
	const street1 = jQuery('input[name="street1"]').val();
	const street2 = jQuery('input[name="street2"]').val();
	const city = jQuery('input[name="city"]').val();
	const state = jQuery('[name="state"]').val();
	const zip = jQuery('input[name="zip"]').val();
	const form = jQuery('input[name=form_id]').val();
	const amt = jQuery('input[name=other_amount]').val();
	const ref = jQuery('input[name=payment_confirmation_id]').val();
	const from_url = decodeURIComponent(jQuery('input[name="from_url"]').val());
	const feeamt = jQuery('input[name=additional_amount]').val();
	const originalamt = jQuery('input[name=gift_amount]').val();
	const fb_share_url = decodeURIComponent(jQuery('input[name="fb_share_url"]').val());
	const twitter_share_url = decodeURIComponent(jQuery('input[name="twitter_share_url"]').val());

	jQuery('.donation-loading').remove();
	jQuery('.donate-now, .header-donate').hide();
	jQuery('.thank-you').show();
	let ty_url = "/amazonpay/ym-primary/amazon/thankyou.html";
	jQuery.get(ty_url,function(datat){
		jQuery('.thank-you').html(jQuery(datat).find('.thank-you').html());
		jQuery('p.first, span.first').html(first);
		jQuery('p.last').html(last);
		jQuery('p.street1').html(street1);
		jQuery('p.street2').html(street2);
		jQuery('p.city').html(city);
		jQuery('p.state').html(state);
		jQuery('p.zip').html(zip);
		jQuery('p.email').html(email);
		jQuery('tr.cardGroup').hide();
		jQuery('tr.amazon').show();
		jQuery('p.fee-amount').html("$" + feeamt);
		jQuery('p.original-amount').html("$" + originalamt);
		jQuery('p.amount').html("$"+amt);
		jQuery('p.confcode').html(ref);
		jQuery('p.from_url').html("<a href='"+from_url+"'>Return</a>");
		jQuery('a.from_url').attr('href', from_url);
		jQuery('#fb-share').attr('href', fb_share_url);
		jQuery('#twitter-share').attr('href', twitter_share_url);
		// jQuery('span.participant').html(participant_name);
		jQuery('.share-url a').each(function(){
			jQuery(this).attr("href",jQuery(this).attr("href").replace("%returnurl%",escape(from_url)));
		});
	});

	/* ECOMMERCE TRACKING CODE */
	// ga('require', 'ecommerce');
	// ga('ecommerce:addTransaction', {
	// 	'id': ref,
	// 	'affiliation': 'AHA ApplePay Donation',
	// 	'revenue': amt,
	// 	'city': city,
	// 	'state': state // local currency code.
	// });
	// ga('ecommerce:send');
	// ga('send', 'pageview', '/donateok.asp');

	pushDonationSuccessToDataLayer(form, ref, amt);
}

function clearStorage() {
	localStorage.removeItem('amz_aha_signature');
	localStorage.removeItem('amz_aha_amt');
	localStorage.removeItem('ahaDonate');
}

function submitAmazonDonation() {
	clearStorage();
	jQuery("#double_the_donation_company_id").val(jQuery('input[name=doublethedonation_company_id]').val());
	const amzFrom = jQuery('.donation-form').serialize();
	localStorage.setItem('ahaDonate', amzFrom);
	getSignature(amazonPayInitCheckout);
}
