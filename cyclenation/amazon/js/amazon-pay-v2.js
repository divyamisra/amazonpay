// Amazon V2
function isSandbox() {
	if ($("input[name=instance]").val() == 'heartdev' || $("input[name=df_preview]").val()) {
		return true;
	}
	return false;
}

/**
 * Build the URL parameters for the signature request
 */
function buildSignatureParams() {
	const returnUrl = location.href.replaceAll('&','%26');
	const proxy_type_value = $('#proxy_type_value').val();
	let signParams = "other_amount=" + $('input[name=other_amount]').val();
	signParams += "&fr_id=" + $('input[name=fr_id]').val();
	signParams += "&proxy_type_value=" + proxy_type_value;
	if (proxy_type_value == 22) {
		signParams += "&team_id=" + $('#team_id').val();
	} else if (proxy_type_value == 21) {
		signParams += "&ev_id=" + $('#ev_id').val();
	} else {
		signParams += "&cons_id=" + $('#cons_id').val();
	}
	signParams += "&custom_note=" + $('#campaign_name').val();
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

	$.ajax({
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
	localStorage.setItem('amz_aha_amt', $('input[name=other_amount]').val());

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

	$.ajax({
		method: "POST",
		cache: false,
		dataType: "json",
		url: "https://tools.heart.org/donate/amazon/v2/checkout.php?" + params + "&callback=?",
		success: function(data) {
			console.log(data);

			if (data.status != 200) {
				// handle error
				let errorMessage = 'Your payment was not successful. Please try another payment method.';
				$('#donation-errors').remove();
				$('.donation-form').prepend('<div id="donation-errors" role="alert" aria-atomic="true" aria-live="assertive">' +
						'<div class="alert alert-danger">' +
						errorMessage +
						'</div></div>');
				$('.donation-loading').remove();
				$('.donation-form').show();
			} else {
				//save off amazon id into custom field
				$('input[name=check_number]').val(data.response.chargePermissionId);
				$('input[name=payment_confirmation_id]').val('AMAZON:'+data.response.chargePermissionId);
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
			$('#donation-errors').remove();
			$('.donation-form').prepend(`<div id="donation-errors" role="alert" aria-atomic="true" aria-live="assertive"><div class="alert alert-danger">Your payment was not successful. Please try another payment method.</div></div>`);
			$('.donation-loading').remove();
			$('.donation-form').show();
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
	$('.donation-form input').not('input:checkbox, input:radio').each(function(){
		$(this).val(decodeURI(donateData[this.name]).replace('%40', '@').replaceAll('+', ' ').replaceAll('%2B', ' '));
	});
	// populate selects
	$('.donation-form select').each(function(){
		$(this).val(donateData[this.name]);
	});
	// populate checkboxs
	$('.donation-form input:checkbox').each(function(){
		if(donateData[this.name]){
			$(this).prop('checked', true);
		}
	});
	// reset gift amount
	// populateAmount(donateData['other_amount'] - donateData['additional_amount']);
	populateAmount(donateData['other_amount']);
}

/**
 * Populate and display the confirmation page
 */
function showConfirmationPage() {
	const email = $('input[name="email"]').val();
	const first = $('input[name="first_name"]').val();
	const last = $('input[name="last_name"]').val();
	const street1 = $('input[name="street1"]').val();
	const street2 = $('input[name="street2"]').val();
	const city = $('input[name="city"]').val();
	const state = $('[name="state"]').val();
	const zip = $('input[name="zip"]').val();
	const form = $('input[name=form_id]').val();
	const amt = $('input[name=other_amount]').val();
	const ref = $('input[name=payment_confirmation_id]').val();
	const from_url = decodeURIComponent($('input[name="from_url"]').val());
	const feeamt = $('input[name=additional_amount]').val();
	const originalamt = $('input[name=gift_amount]').val();
	const fb_share_url = decodeURIComponent($('input[name="fb_share_url"]').val());
	const twitter_share_url = decodeURIComponent($('input[name="twitter_share_url"]').val());

	$('.donation-loading').remove();
	$('.donate-now, .header-donate').hide();
	$('.thank-you').show();
	let ty_url = "/amazonpay/cyclenation/amazon/thankyou.html";
	$.get(ty_url,function(datat){
		$('.thank-you').html($(datat).find('.thank-you').html());
		$('p.first, span.first').html(first);
		$('p.last').html(last);
		$('p.street1').html(street1);
		$('p.street2').html(street2);
		$('p.city').html(city);
		$('p.state').html(state);
		$('p.zip').html(zip);
		$('p.email').html(email);
		$('tr.cardGroup').hide();
		$('tr.amazon').show();
		$('p.fee-amount').html("$" + feeamt);
		$('p.original-amount').html("$" + originalamt);
		$('p.amount').html("$"+amt);
		$('p.confcode').html(ref);
		$('p.from_url').html("<a href='"+from_url+"'>Return</a>");
		$('a.from_url').attr('href', from_url);
		$('#fb-share').attr('href', fb_share_url);
		$('#twitter-share').attr('href', twitter_share_url);
		$('.share-url a').each(function(){
			$(this).attr("href",$(this).attr("href").replace("%returnurl%",escape(from_url)));
		});
	});

	pushDonationSuccessToDataLayer(form, ref, amt);
}

function clearStorage() {
	localStorage.removeItem('amz_aha_signature');
	localStorage.removeItem('amz_aha_amt');
	localStorage.removeItem('ahaDonate');
}

function submitAmazonDonation() {
	clearStorage();
	$("#double_the_donation_company_id").val($('input[name=doublethedonation_company_id]').val());
	const amzFrom = $('.donation-form').serialize();
	localStorage.setItem('ahaDonate', amzFrom);
	getSignature(amazonPayInitCheckout);
}
