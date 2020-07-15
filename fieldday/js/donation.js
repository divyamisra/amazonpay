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
		url: "https://hearttools.heart.org/donate/convio-offline/addOfflineDonation-tr.php?" + params + "&callback=?",
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
  }
  if (data2.event_title != " " && dtype == "e") {
    jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Event:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.event_title+'</a></div>');
    jQuery('.page-header h1').text('Donate to '+data2.event_title);
  }
  if (data2.part_name != " " && dtype == "p") {
    jQuery('.donation-form-container').before('<div class="donation-detail"><strong>Donating to Student:</strong><br/><a href="'+jQuery('input[name=from_url]').val()+'">'+data2.part_name+'</a></div>');
    jQuery('.page-header h1').text('Donate to '+data2.part_name);
  }

  jQuery('input[name=form_id]').val(data2.don_form_id);
  });
}
