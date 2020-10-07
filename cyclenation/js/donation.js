// Post offline gift to Luminate
function donateOffline(donateOfflineCallback) {
	let params = jQuery('.donation-form').serialize();

	jQuery.ajax({
		method: "POST",
		async: false,
		cache: false,
		dataType: "json",
		url: "https://tools.heart.org/donate/convio-offline/addOfflineDonation-tr.php?" + params + "&callback=?",
		success: donateOfflineCallback
	});
}

/**
 * Get the Transaction ID and Confirmation Code for transactions added via the API
 * @param {*} responseData - From the donateOffline success callback
 */
function donateOfflineCallback(responseData) {
	const nameField = $('input[name=campaign_name]').length ? $('input[name=campaign_name]').val() : "Heart Walk";
	const campaign_name = ($('input[name=instance]').val() == "heartdev" ? "heartdev " : "") + nameField;

	const widgetData = {
		// transactionId: responseData.data.donationResponse.donation.transaction_id,
		confirmationCode: responseData.addGift.addGiftResponse.gift.checkNumber,
		transactionDate: responseData.addGift.addGiftResponse.gift.date,
		email: jQuery('input[name="email"]').val(),
		firstName: jQuery('input[name="first_name"]').val(),
		lastName: jQuery('input[name="last_name"]').val(),
		amt: jQuery('input[name=other_amount]').val(),
		form: campaign_name,
		ddCompanyId: jQuery('input[name=doublethedonation_company_id]').val()
	};

	// Call only if the widget is on the form
	if (jQuery('input[name=doublethedonation_company_id]').length > 0) {
		doubleDonationConfirmation(widgetData);
	}
}

/**
 * Post matching gift info
 * @param {*} widgetData
 */
function doubleDonationConfirmation(widgetData) {

	var domain = doublethedonation.integrations.core.strip_domain(widgetData.email);
	doublethedonation.plugin.load_config();
	doublethedonation.plugin.set_donation_id(widgetData.confirmationCode);
	doublethedonation.plugin.set_donation_campaign(widgetData.form);
	doublethedonation.plugin.email_domain(domain);

	if (widgetData.ddCompanyId !== "") {
		doublethedonation.plugin.set_company(widgetData.ddCompanyId);
	}

	doublethedonation.integrations.core.register_donation({
		"360matchpro_public_key": "w5JH5j9ID4Cf6zMh",
		"campaign": widgetData.form,
		"donation_identifier": widgetData.confirmationCode,
		"donation_amount": widgetData.amt,
		"donor_first_name": widgetData.firstName,
		"donor_last_name": widgetData.lastName,
		"donor_email": widgetData.email,
		"doublethedonation_company_id": widgetData.ddCompanyId,
		"doublethedonation_status": null
	});

	// delay triggering the widget
	setTimeout(function() {
		if (window.doublethedonation) {
			doublethedonation.plugin.load_plugin();
		}
	}, 1500);
}

// Double the Donation Widget
if(!window.doublethedonation) {
	jQuery("#dd-company-name-input").html("<div class='form-row'><div class='form-content'><input type='text'/></div></div>");
}
jQuery(document).on("doublethedonation_company_id", function () {
	var dtd_company_id = jQuery('input[name="doublethedonation_company_id"]').val();
	jQuery("#double_the_donation_company_id").val(dtd_company_id);
});
