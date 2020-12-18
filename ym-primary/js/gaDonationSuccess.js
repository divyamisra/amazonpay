window.pushDonationSuccessToDataLayer = function(formId, trackingCode, giftAmount) {
    formId = formId || '';
    trackingCode = trackingCode || '';
    giftAmount = giftAmount || '0';
    giftAmount = (giftAmount + '').replace('$', '').replace(/,/g, '');
    var donationDateObject = new Date(), 
    donationDateMonth = donationDateObject.getMonth() + 1, 
    donationDateDay = donationDateObject.getDate(), 
    donationDateYear = donationDateObject.getFullYear();
    if(donationDateMonth < 10) {
        donationDateMonth = '0' + donationDateMonth;
    }
    if(donationDateDay < 10) {
        donationDateDay = '0' + donationDateDay;
    }
    var donationDate = donationDateMonth + '/' + donationDateDay + '/' + donationDateYear;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
    'event': 'transaction', 
    'paymentMethod': 'credit card', 
        'transactionType': 'development donate now', 
        'donationDate': donationDate, 
    'ecommerce': {
        'currencyCode': 'USD', 
        'purchase': {
        'actionField': {
            'affiliation': 'development', 
            'id': 'donation-' + trackingCode, 
            'revenue': giftAmount, 
            'shipping': '0', 
            'tax': '0', 
        }, 
        'products': [
            {
                'name': 'development donate now', 
                'id': 'form-' + formId, 
                'price': giftAmount, 
                'brand': 'donate now', 
                'category': 'straight donation', 
                'variant': 'donatenow_heart', 
            'quantity': 1
            }
        ]
        }
    }
    });
};
