/*!
 * American Heart Association
 * Project files are compiled with gulp. See source for modifications
 * 
 * @author Dean Huntley, DH Web Works, Inc.
 * @version 1.0.0
 */
//function to read and parse querystring
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
	
    jqcn.fn.serializeFormJSON = function () {
        var o = {};
        var a = this.serializeArray();
        jqcn.each(a, function () {
            if (o[this.name]) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };
}(jqcn));

//if (window.location.protocol !== 'https:') {
//   location.href = location.href.replace(/^http:/, 'https:');
//}

// =========================================================================================================
// BRAINTREE PAYMENT FUNCTIONS
// =========================================================================================================
// =========================================================================================================
// Initial setup to add styles, button and hidden input fields 
// then call braintree to init payment processes
// =========================================================================================================
var ahaBraintreePlugin;

var braintree_client_token;
var applePayInstance;
var venmoInstance;
var session = "";

var braintree_aha = { 
	applePayPaymentType	: (jQuery.getQuerystring("btmethod") == "") ? true : false,
	applePaySubmitButton: '#donate-submit',
	venmoPaymentType	: (jQuery.getQuerystring("btmethod") == "") ? true : false,
	venmoSubmitButton	: '#donate-button',
	venmoSubmitBlock	: '#donate-button-block',
	donation_form		: jQuery('form'),
	donation_result		: "",
	payment_method		: (jQuery.getQuerystring("btmethod") == "") ? "applepay" : "venmo",
	
	initializeBraintree: function() {
		
		//if apple pay is available then start BT process
		var tokenURL = "https://hearttools.heart.org/braintree_new/gettoken.php";
		if (jQuery('input[name=instance]').val() == "heartdev") {
			tokenURL = "https://hearttools.heart.org/braintree_new/gettoken-test.php";
		}
		jQuery.getJSON(tokenURL + "?callback=?",function(data){
		    console.log(data);
			braintree_client_token = data.token;

			braintree.client.create({
				authorization: braintree_client_token
			}, function (clientErr, clientInstance) {
				if (clientErr) {
					console.error('Error creating client:', clientErr);
					return;
				}

				// Inside of your client create callback...
				braintree.dataCollector.create({
					client: clientInstance,
					paypal: true
				}, function (err, dataCollectorInstance) {
					if (err) {
						// Handle error in data collector creation
						return;
					}

					jQuery('input[name=device_data]').val(dataCollectorInstance.deviceData);
				});
				
				if (braintree_aha.applePayPaymentType) {
					//Initialize Apple Pay
					braintree_aha.InitializeApplePay(clientInstance);
				}

				if (braintree_aha.venmoPaymentType) {
					//Initialize Venmo
					braintree_aha.InitializeVenmo(clientInstance);
				}

			});
		});
	},
	//----------------
	// Initialize Venmo using BrainTree
	//----------------
	InitializeVenmo: function(clientInstance) {

		braintree.dataCollector.create({
			client: clientInstance,
			paypal: true
		}, function (dataCollectorErr, dataCollectorInstance) {
			if (dataCollectorErr) {
				// Handle error in creation of data collector.
				return;
			}
				
			// At this point, you should access the deviceData value and provide it
			// to your server, e.g. by injecting it into your form as a hidden input.
			console.log('Got device data:', dataCollectorInstance.deviceData);
		});

		braintree.venmo.create({
			client: clientInstance,
			// Add allowNewBrowserTab: false if your checkout page does not support
			// relaunching in a new tab when returning from the Venmo app. This can
			// be omitted otherwise.
			allowNewBrowserTab: false
		}, function (venmoErr, _venmoInstance) {
			if (venmoErr) {
				console.error('Error creating venmoInstance:', venmoErr);
				return;
			}

			venmoInstance = _venmoInstance;

			if (venmoErr) {
			  console.error('Error creating Venmo:', venmoErr);
			  return;
			}
		
			// Verify browser support before proceeding.
			if (!venmoInstance.isBrowserSupported()) {
			  console.log('Browser does not support Venmo');
  			  jQuery('.ym-page-content').addClass("hidden");
			  jQuery('.no-venmo').removeClass("hidden");
			  return;
			}
			
			jQuery(braintree_aha.venmoSubmitButton).removeClass("hidden");
			jQuery('.ym-page-content').removeClass("hidden");
			jQuery('.no-venmo').addClass("hidden");
			
			//jQuery(braintree_aha.venmoSubmitButton).click(function(){
			//	if (jQuery(braintree_aha.donation_form).valid()) {
			//		braintree_aha.submitVenmoDonation();
			//	}
			//});

			// Check if tokenization results already exist. This occurs when your
			// checkout page is relaunched in a new tab. This step can be omitted
			// if allowNewBrowserTab is false.
			//if (venmoInstance.hasTokenizationResult()) {
			//	braintree_aha.submitVenmoDonation();
			//}
		});
	},

	submitVenmoDonation: function() {
		venmoInstance.tokenize(function (status, payload) {
			if (payload == undefined) {d
				if (status.code === 'VENMO_CANCELED') {
					alert('App is not available or user aborted payment flow');
				} else if (status.code === 'VENMO_APP_CANCELED') {
					alert('User canceled payment flow');
				} else {
  				  alert('An error occurred:', err.message);
  				}
			} else {
				console.log(payload);
				// Send the payment method nonce to your server, e.g. by injecting
				// it into your form as a hidden input.
				console.log('Got a payment method nonce:', payload.nonce);
				// Display the Venmo username in your checkout UI.
				console.log('Venmo user:', payload.details.username);
				jQuery('#venmo_user').val(payload.details.username);

				//jQuery(braintree_aha.venmoSubmitButton).hide().after("<div id='venmo-button' style='background-image:none;color:#fff;'>Processing. Please Wait...</div>");
	
				// Send payload.nonce to your server.
				jQuery("input#payment_method_nonce").val(payload.nonce);

				// Success Venmo
				braintree_aha.postDonationFormVenmo(
					donateVenmo,
					function (textStatus) {
						if (textStatus != "") {
							braintree_aha.showGlobalError(textStatus);
							console.log(textStatus);
						}
					}
				);
			}
		});
	},
			
	postDonationFormVenmo: function(callback_success, callback_fail) {
		var postParams = jQuery(braintree_aha.donation_form).serialize();
		postParams += "&amount="+jQuery('input[name=other_amount]').val();

		var tokenURL = "https://hearttools.heart.org/braintree_new/checkout-tr.php";
		if (jQuery('input[name=instance]').val() == "heartdev") {
			tokenURL = "https://hearttools.heart.org/braintree_new/checkout-tr-test.php";
		}
		jQuery.getJSON(tokenURL + '?callback=?', postParams)
			.done(function(data) {
				braintree_aha.donation_result = data; //JSON.parse(data.toString());
				//var donresult = JSON.parse(data.toString());
				console.log(data.result);
				//
				if (data.error == "") {
					jQuery('input[name=processorAuthorizationCode]').val(data.result.processorAuthorizationCode);
					callback_success();
				} else {
					callback_fail(data.error);
				}
			})
			.error(function() {
				//
				callback_fail();
			}
		);
	},
	
	//==================================================================
	//----------------
	// Initialize Apple Pay using BrainTree
	//----------------
	InitializeApplePay: function(clientInstance) {
		if (window.ApplePaySession) {
			var available = window.ApplePaySession.canMakePayments();
			jQuery(braintree_aha.applePaySubmitButton).removeClass("hidden");
			
			if (available) {
				//jQuery(braintree_aha.applePaySubmitButton).click(function(){
				//	braintree_aha.submitApplePayDonation();
				//});
			
				braintree.applePay.create({
					client: clientInstance
				}, function (applePayErr, _applePayInstance) {
					if (applePayErr) {
						console.error('Error creating applePayInstance:', applePayErr);
						return;
					}
	
					applePayInstance = _applePayInstance;
	
					var promise = ApplePaySession.canMakePaymentsWithActiveCard(_applePayInstance.merchantIdentifier);
					promise.then(function (canMakePaymentsWithActiveCard) {
						if (canMakePaymentsWithActiveCard) {
							// Set up Apple Pay buttons
							// !!!!!!!!!!!!!!!!!!!!!!!!!
						}
					});
				});
			}
		}
	},

	submitApplePayDonation: function() {
		
		// processApplePayBraintreePayment() defined in Block_PaymentMethods.ascx
		this.processApplePayBraintreePayment(
			function () {
				// Success Apple Pay
				braintree_aha.postDonationFormApplePay(
					donateApplePay,
					function (textStatus) {
						if (textStatus != "") {
							braintree_aha.showGlobalError(textStatus);
						}
					}
				);
			},
			function (message) {
				// Failed Apple Pay
				braintree_aha.showGlobalError(message);
			});
	},

	processApplePayBraintreePayment: function(callback_success, callback_fail) {
		if(typeof applePayInstance === 'undefined') {
			return false;
		}
		
		var paymentRequest = applePayInstance.createPaymentRequest({
			countryCode: 'US',
			currencyCode: 'USD',
			supportedNetworks: ['visa', 'masterCard', 'amex', 'discover'],
			merchantCapabilities: ['supports3DS'],
			requiredBillingContactFields: ["postalAddress", "name"],
			requiredShippingContactFields: ["name", "email"],
			total: {
				label: 'heart.org',
				amount: jQuery('input[name=other_amount]').val()
			}
		});

		session = new ApplePaySession(1, paymentRequest);

		session.onvalidatemerchant = function (event) {
			applePayInstance.performValidation({
				validationURL: event.validationURL,
				displayName: 'AHA Donations'
			}, function (validationErr, merchantSession) {
				console.log("Merchant validated");

				if (validationErr) {
					// You should show an error to the user, e.g. 'Apple Pay failed to load.'
					console.error('Error validating merchant:', validationErr);
					session.abort();

					callback_fail('Apple Pay failed to load (error validating merchant).');
					return;
				}

				session.completeMerchantValidation(merchantSession);
			});
		};

		session.onpaymentauthorized = function (event) {
			applePayInstance.tokenize({
				token: event.payment.token
			}, function (tokenizeErr, payload) {
				if (tokenizeErr) {
					session.completePayment(ApplePaySession.STATUS_FAILURE);
					callback_fail('Apple Pay failed to load (error tokenizing apple pay).');
					return;
				}

				// Fill address
				//braintree_aha.DonationFillApplePayBillingAddress(event.payment.billingContact, event.payment.shippingContact)
				//fill in billing address details
		
				// Send payload.nonce to your server.
				jQuery("input#payment_method_nonce").val(payload.nonce);

				// SUCCESS
				callback_success();
			});
		};

		session.oncancel = function (event) {
			callback_fail("Your payment method cannot be processed at this time. Please try again later or choose a different payment option.");
		};

		session.begin();
	},

	DonationFillApplePayBillingAddress: function(billingContact, shippingContact) {
		if (shippingContact.givenName != "" && shippingContact.familyName != "") {
			jQuery("#FirstName").val(shippingContact.givenName);
			jQuery("#LastName").val(shippingContact.familyName);
		}
		else {
			jQuery("#FirstName").val(billingContact.givenName);
			jQuery("#LastName").val(billingContact.familyName);
		}

		jQuery("#EmailAddress").val(shippingContact.emailAddress);
		jQuery("#Phone").val("");

		var countryCode = billingContact.countryCode.toUpperCase();
		if (countryCode == "") countryCode = billingContact.country.toUpperCase();
		if (countryCode == "USA") countryCode = "US";
		if (countryCode == "UNITED STATES") countryCode = "US";
		jQuery("#CountryId").val(countryCode).trigger("change");;

		jQuery("#Address1").val(billingContact.addressLines[0]);

		if (billingContact.addressLines.length > 1 && billingContact.locality == "")
			jQuery("#City").val(billingContact.addressLines[1]);

		if (billingContact.locality != "")
			jQuery("#City").val(billingContact.locality);

		jQuery("#StateId").val(billingContact.administrativeArea.toUpperCase());
		jQuery("#Province").val(billingContact.administrativeArea.toUpperCase());
		jQuery("#PostalCode").val(billingContact.postalCode);

		var zip = billingContact.postalCode;
		if (zip.length > 5) zip = zip.substr(0, 5);
		jQuery("#ZipCode").val(zip);
	},

	postDonationFormApplePay: function(callback_success, callback_fail) {
		var postParams = jQuery(braintree_aha.donation_form).serialize();
		postParams += "&amount="+jQuery('input[name=other_amount]').val();
				
		jQuery.getJSON('https://hearttools.heart.org/braintree_new/checkout-tr.php?callback=?', postParams)
			.done(function(data) {
				braintree_aha.donation_result = data; //JSON.parse('['+data.result.toString()+']');
				console.log(data.result);
				//
				if (data.error == "") {
					//jQuery('input[name=processorAuthorizationCode]').val(data.result.processorAuthorizationCode);
					jQuery('input[name=processorAuthorizationCode]').val(data.result.processorAuthorizationCode);
					session.completePayment(ApplePaySession.STATUS_SUCCESS);
					callback_success();
				} else {
					session.completePayment(ApplePaySession.STATUS_FAILURE);
					callback_fail(data.error);
				}
			})
			.fail(function() {
				//
				callback_fail();
			}
		);
	},
	
	successSubmitDonation: function() {
		//braintree_aha.donation_result
		location.href = jQuery('input[name=finish_success_redirect]').val();
	},
	
	showGlobalError: function(message) {
		alert(message);
	}
}


//==========================================
// START PROCESS
//==========================================
ahaBraintreePlugin = Object.create(braintree_aha);
ahaBraintreePlugin.initializeBraintree();
