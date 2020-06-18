// Calculate fee amount
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
        jQuery('#confirmationAmt').text(feeOption.otherAmount.val());
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