/*!
 * American Heart Association
 * Project files are compiled with gulp. See source for modifications
 * 
 * @author Dean Huntley, DH Web Works, Inc.
 * @version 1.0.0
 */
//function to read and parse querystring
(function ($) {
	jQuery.extend({
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
	
    jQuery.fn.serializeFormJSON = function () {
        var o = {};
        var a = this.serializeArray();
        jQuery.each(a, function () {
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
	googlePaySubmitButton: '#donate-submit',
	donation_form		: jQuery('form'),
	donation_result		: "",
	
	initializeBraintree: function() {
		
		//if apple pay is available then start BT process
		var tokenURL = "https://hearttools.heart.org/braintree/gettoken.php";
		if (jQuery('input[name=instance]').val() == "heartdev") {
			tokenURL = "https://hearttools.heart.org/braintree/gettoken-test.php";
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
				
				//Initialize Google Pay
				braintree_aha.InitializeGooglePay(clientInstance);

			});
		});
	},
	//----------------
	// Initialize GooglePay using Braintree
	//----------------
	InitializeGooglePay: function(clientInstance) {
		braintree.googlePayment.create({
   			client: clientInstance, // From braintree.client.create, see below for full example
			googlePayVersion: 2,
			googleMerchantId: '14659556990032307902'
			//googleMerchantId: '14659556990032307902' // Optional in sandbox; if set in sandbox, this value must be a valid production Google Merchant ID
		  }, function (err, googlePaymentInstance) {
		  	// Set up Google Pay button
			if (googlePaymentInstance != undefined) {
				jQuery('.ym-page-content').removeClass("hidden");
				jQuery('.no-venmo').addClass("hidden");
				braintree_aha.googlePaymentInstance = googlePaymentInstance;
			} else {
				jQuery('.ym-page-content').addClass("hidden");
				jQuery('.no-venmo').removeClass("hidden");
				console.log(err, googlePaymentInstance);
			}
		  }
		);
	},
	submitGooglePayDonation: function() {
		var paymentDataRequest = braintree_aha.googlePaymentInstance.createPaymentDataRequest({
			transactionInfo: {
				currencyCode: 'USD',
				totalPriceStatus: 'FINAL',
				totalPrice: jQuery('input[name=other_amount]').val() // Your amount
			}
		});

		// We recommend collecting billing address information, at minimum
		// billing postal code, and passing that billing postal code with all
		// Google Pay card transactions as a best practice.
		// See all available options at https://developers.google.com/pay/api/web/reference/object
		var cardPaymentMethod = paymentDataRequest.allowedPaymentMethods[0];
		cardPaymentMethod.parameters.billingAddressRequired = true;
		cardPaymentMethod.parameters.billingAddressParameters = {
			format: 'FULL',
			phoneNumberRequired: true
		};
		
		var googleEnv = (jQuery('input[name=instance]').val() == 'heartdev') ? 'TEST' : 'PRODUCTION';
		var paymentsClient = new google.payments.api.PaymentsClient({
		  environment:  googleEnv // 'TEST' Or 'PRODUCTION'
		});
		
		paymentsClient.loadPaymentData(paymentDataRequest).then(function(paymentData) {
			braintree_aha.googlePaymentInstance.parseResponse(paymentData, function (err, result) {
				if (err) {
				// Handle parsing error
				}

				// Send payload.nonce to your server.
				jQuery("input#payment_method_nonce").val(result.nonce);

				// Success GooglePay
				braintree_aha.postDonationFormGooglePay(
					donateGooglePay,
					function (textStatus) {
						if (textStatus != "") {
							braintree_aha.showGlobalError(textStatus);
							console.log(textStatus);
						}
					}
				);
			});
		}).catch(function (err) {
			// Handle errors
		});
	},
	postDonationFormGooglePay: function(callback_success, callback_fail) {
		var postParams = jQuery(braintree_aha.donation_form).serialize();
		postParams += "&amount="+jQuery('input[name=other_amount]').val();
				
		var tokenURL = "https://hearttools.heart.org/braintree/checkout.php";
		if (jQuery('input[name=instance]').val() == "heartdev") {
			tokenURL = "https://hearttools.heart.org/braintree/checkout-test.php";
		}
		$.getJSON(tokenURL + '?callback=?', postParams)
			.done(function(data) {
				braintree_aha.donation_result = data; //JSON.parse('['+data.result.toString()+']');
				console.log(data.result);
				//
				if (data.error == "") {
					jQuery('input[name=processorAuthorizationCode]').val(data.result.processorAuthorizationCode);
					callback_success();
				} else {
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
