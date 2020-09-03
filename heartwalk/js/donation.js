// Calculate fee amount
const formatter = new Intl.NumberFormat('en-US', {
	style: 'currency',
	currency: 'USD',
	minimumFractionDigits: 2
});

const feeOption = {
    transactionRate: .029, // 2.9%
    transactionFee: .29, // $.29
    gitAmount: jQuery('input[name=gift_amount]'),
    additionalAmount: jQuery('input[name=additional_amount]'),
    otherAmount: jQuery('input[name=other_amount]'),
    
    coverFee: function() {
      if(jQuery('#cover_fee').prop('checked')){
        feeOption.additionalAmount.val(feeOption.calculateFee());
      } else {
        feeOption.additionalAmount.val(0);
      } 
      feeOption.setGiftAmount();
      feeOption.setDisplayAmount();
    },

    setGiftAmount: function() {
        feeOption.otherAmount.val(parseFloat(feeOption.gitAmount.val()) + parseFloat(feeOption.additionalAmount.val()));
    },

    setDisplayAmount: function() {
        jQuery('#confirmationAmt').text(formatter.format(feeOption.otherAmount.val()));
    },

    calculateFee: function() {
        return ((parseFloat(feeOption.gitAmount.val()) * feeOption.transactionRate) + feeOption.transactionFee).toFixed(2);
    },
};
  
jQuery('#other-amount-entered').on('blur', function(){
	feeOption.coverFee();
});
jQuery('#cover_fee, .radio-level').on('click', function(){
	feeOption.coverFee();
});


// Post offline gift to Luminate
function donateOffline() {
	var params = jQuery('.donation-form').serialize();

	jQuery.ajax({
		method: "POST",
		async: false,
		cache: false,
		dataType: "json",
		url: "https://tools.heart.org/donate/convio-offline/addOfflineDonation-tr.php?" + params + "&callback=?",
		success: function(data) {
			//donateCallback.success(data.data);
		}
	});
}

// Display event info
if (location.href.indexOf("donate_applepay") > 0 || location.href.indexOf("donate_venmo") > 0 || location.href.indexOf("donate_amazon") > 0 || location.href.indexOf("donate_googlepay") > 0) {
  let eid = jQuery('input[name=fr_id]').val();
  let dtype = (jQuery('input[name=proxy_type_value]').val() == 20 || jQuery('input[name=proxy_type_value]').val() == 2) ? "p" : ((jQuery('input[name=proxy_type_value]').val() == 21) ? "e" : "t");
  let pid = (dtype == "p") ? jQuery('input[name=cons_id]').val() : "";
  let tid = (dtype == "t") ? jQuery('input[name=team_id]').val() : "";
  let isDev = (jQuery('input[name=instance]').val() == "heartdev");
  let tr_info = isDev ? "https://secure3.convio.net/heartdev/site/SPageNavigator/reus_donate_amazon_tr_info.html" : "https://www2.heart.org/site/SPageNavigator/reus_donate_amazon_tr_info.html";

  jQuery.getJSON(tr_info+"?pgwrap=n&fr_id="+eid+"&team_id="+tid+"&cons_id="+pid+"&callback=?",function(data2){
  if (data2.team_name != "" && dtype == "t") {
    jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Team Name:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.team_name+'</a></div>');
    jQuery('.page-header h1').text('Donate to '+data2.team_name);
    jQuery('input[name=participant_name]').val(data2.team_name);
  }
  if (data2.event_title != " " && dtype == "e") {
    jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Event:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.event_title+'</a></div>');
    jQuery('.page-header h1').text('Donate to '+data2.event_title);
  }
  if (data2.part_name != " " && dtype == "p") {
    jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Participant:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.part_name+'</a></div>');
    jQuery('.page-header h1').text('Donate to '+data2.part_name);
    jQuery('input[name=participant_name]').val(data2.part_name);
  }

  jQuery('input[name=form_id]').val(data2.don_form_id);
  });
}

// GA Donation Success
(function(){
	var a = document.createElement('script');
	a.type = 'text/javascript';
	a.src = '../amazonpay/fieldday/js/gaDonationSuccess.js';
	var s = document.getElementsByTagName('script')[0];
	s.parentNode.insertBefore(a, s);
})();

// UI for amount selection
jQuery('.donation-amount-container').click(function(){
	jQuery('.donate-select .active').removeClass("active");
	jQuery('input[name=radioAmt]').attr({'aria-checked': false});
	jQuery(this).children('label').addClass("active");
	jQuery(this).children('label').children('input').attr({'aria-checked': true});
	if(jQuery(this).attr('id') == 'other-amount-input-group') {
		jQuery('#level-other').attr({'aria-checked': true}).prop('checked', true);
	}
});

// Double the Donation Widget
if(!window.doublethedonation) {
	jQuery("#dd-company-name-input").html("<div class='form-row'><div class='form-content'><input type='text'/></div></div>");
}
jQuery(document).on("doublethedonation_company_id", function () {
	var dtd_company_id = jQuery('input[name="doublethedonation_company_id"]').val();
	jQuery("#double_the_donation_company_id").val(dtd_company_id);
});
