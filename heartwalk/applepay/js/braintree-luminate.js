/*!
 * Save the Children
 * Project files are compiled with gulp. See source for modifications
 * 
 * @author Dean Huntley, DH Web Works, Inc.
 * @version 1.0.0
 */
//function to read and parse querystring
(function ($) {
	$.extend({
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
	
    $.fn.serializeFormJSON = function () {
        var o = {};
        var a = this.serializeArray();
        $.each(a, function () {
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
}(jQuery));

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
	applePayPaymentType	: ($.getQuerystring("btmethod") == "") ? true : false,
	applePaySubmitButton: '.radio-applepay',
	venmoPaymentType	: ($.getQuerystring("method") == "venmo") ? true : false,
	venmoSubmitButton	: '#venmo-button',
	venmoSubmitBlock	: '#venmo-button-block',
	donation_form		: $('form'),
	donation_result		: "",
	payment_method		: ($.getQuerystring("btmethod") == "") ? "applepay" : "venmo",
	
	initializeBraintree: function() {
		
		//if apple pay is available then start BT process
		$.getJSON("https://hearttools.heart.org/braintree/gettoken.php?callback=?",function(data){
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

					$('input[name=device_data]').val(dataCollectorInstance.deviceData);
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
			  return;
			}
			
			$(braintree_aha.venmoSubmitButton).prop('disabled', false);  //set disabled status based on available fla
			$(braintree_aha.venmoSubmitBlock).removeClass("hidden");
			
			$('.venmo-fields').show();
			
			$(braintree_aha.venmoSubmitButton).click(function(){
				if ($(braintree_aha.donation_form).valid()) {
					braintree_aha.submitVenmoDonation();
				}
			});

			// Check if tokenization results already exist. This occurs when your
			// checkout page is relaunched in a new tab. This step can be omitted
			// if allowNewBrowserTab is false.
			if (venmoInstance.hasTokenizationResult()) {
				braintree_aha.submitVenmoDonation();
			}
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

				$(braintree_aha.venmoSubmitButton).hide().after("<div id='venmo-button' style='background-image:none;color:#fff;'>Processing. Please Wait...</div>");
	
				// Send payload.nonce to your server.
				$("input#payment_method_nonce").val(payload.nonce);

				// Success Venmo
				braintree_aha.postDonationFormVenmo(
					braintree_aha.successSubmitDonation,
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
		var postParams = $(braintree_aha.donation_form).serialize();
		postParams += "&amount="+$('input[name=level_standardexpanded]:checked').val();

		$.post('/braintree/checkout.php', postParams)
			.done(function(data) {
				braintree_aha.donation_result = JSON.parse(data.toString());
				var donresult = JSON.parse(data.toString());
				console.log(donresult);
				//
				if (donresult.error == "") {
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
				//$(braintree_aha.applePaySubmitButton).click(function(){
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
				amount: $('input[name=other_amount]').val()
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
				braintree_aha.DonationFillApplePayBillingAddress(event.payment.billingContact, event.payment.shippingContact)
				//fill in billing address details
		
				// Send payload.nonce to your server.
				$("input#payment_method_nonce").val(payload.nonce);

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
			$("#FirstName").val(shippingContact.givenName);
			$("#LastName").val(shippingContact.familyName);
		}
		else {
			$("#FirstName").val(billingContact.givenName);
			$("#LastName").val(billingContact.familyName);
		}

		$("#EmailAddress").val(shippingContact.emailAddress);
		$("#Phone").val("");

		var countryCode = billingContact.countryCode.toUpperCase();
		if (countryCode == "") countryCode = billingContact.country.toUpperCase();
		if (countryCode == "USA") countryCode = "US";
		if (countryCode == "UNITED STATES") countryCode = "US";
		$("#CountryId").val(countryCode).trigger("change");;

		$("#Address1").val(billingContact.addressLines[0]);

		if (billingContact.addressLines.length > 1 && billingContact.locality == "")
			$("#City").val(billingContact.addressLines[1]);

		if (billingContact.locality != "")
			$("#City").val(billingContact.locality);

		$("#StateId").val(billingContact.administrativeArea.toUpperCase());
		$("#Province").val(billingContact.administrativeArea.toUpperCase());
		$("#PostalCode").val(billingContact.postalCode);

		var zip = billingContact.postalCode;
		if (zip.length > 5) zip = zip.substr(0, 5);
		$("#ZipCode").val(zip);
	},

	postDonationFormApplePay: function(callback_success, callback_fail) {
		var postParams = $(braintree_aha.donation_form).serialize();
		postParams += "&amount="+$('input[name=other_amount]').val();
				
		$.getJSON('https://hearttools.heart.org/braintree/checkout.php?callback=?', postParams)
			.done(function(data) {
				braintree_aha.donation_result = data; //JSON.parse('['+data.result.toString()+']');
				console.log(data.result);
				//
				if (data.error == "") {
					//$('input[name=processorAuthorizationCode]').val(data.result.processorAuthorizationCode);
					$('input[name=processorAuthorizationCode]').val(data.result.processorAuthorizationCode);
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
		location.href = $('input[name=finish_success_redirect]').val();
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