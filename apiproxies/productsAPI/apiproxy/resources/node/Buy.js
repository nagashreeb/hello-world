var argo = require('argo');
var express = require('express');
var https = require('https');


var app = express();

var paypaltoken = '' ;
var cat = '' ;
var apikey= 'chl13otH68kdPCKzsIR038kUhUI9AAp2';
var clienthost = "http://api.cosafinity.com/";

app.get('/:prodid/buy',function(req,res){
    apikey= req.query.apikey;
	var prod = req.params.prodid;
  
	cat = 'General'
	if ( prod.indexOf('Appliance') >=0 ){
		cat = 'Appliances';
	}else if ( prod.indexOf('Baby')>=0) {
		cat ='Baby'; 
	}else if ( prod.indexOf('Clothing') >=0 ){
		cat = 'Clothing';
	}
	console.log(cat);
  	console.log(apikey);
	var options = {
					hostname: 'api.sandbox.paypal.com',port: 443, path: '/v1/oauth2/token', method:'POST',
					headers: { 'Authorization' : 'Basic QWFNNjh4RGk5UlJGRENFLW55TDRfSzRRM2VQVzJxdWxJcmxHZTNSRXBXZHlUbWM1RFBScGtLQ3FtRVZ3OkVFNWhJUkJmLWdrbmRNRUk0YzZ2aTVwZmJCT29CNmppdkUyMW9uVUwxRGxMQlg3cVJubmtRZ3Zxa3I3Sg==',
				              'Accept': 'application/json',
				          		'Content-Type': 'application/x-www-form-urlencoded'}
				   } ;
	var oauth_req = https.request(options, function(oauthres){
		  console.log("statusCode: ", oauthres.statusCode);
		  console.log("headers: ", oauthres.headers);

		  oauthres.on('data', function(d) {
		    paypaltoken = JSON.parse(d).access_token;
		    console.log(paypaltoken);
		    createPayment (res) ;
		  });
		  oauthres.on('error', function(d) {
		    console.log(d);
		  });
	});
	oauth_req.on('error', function(e) {
  		console.log('problem with request: ' + e.message);
	});
	
	// write data to request body
	oauth_req.write('grant_type=client_credentials');
	oauth_req.end();
});

app.listen(3000);

function createPayment(res){
	var options = {
					hostname: 'api.sandbox.paypal.com',port: 443, path: '/v1/payments/payment', method:'POST',
					headers: { 'Authorization' : 'Bearer ' + paypaltoken,
				              'Accept': 'application/json',
				          		'Content-Type': 'application/json'}
				   } ;
	var paymentreq = https.request(options, function(paymentresponse){
		console.log("statusCode: ", paymentresponse.statusCode);
		  console.log("headers: ", paymentresponse.headers);

		  paymentresponse.on('data', function(d) {
		    console.log(d.toString());
		    var pres = JSON.parse(d.toString());
		    var obj = pres.links.filter(function(e){
		    	if(e.rel=='approval_url') return true;
		    });
		    console.log(obj);
		    res.status(302);
		    res.header('Location', obj[0].href );
		    //res.write(JSON.stringify(obj));
		    res.end();
		  });
		  paymentresponse.on('error', function(d) {
		    console.log(d);
		  });
	});		 
	var data = {
				  "intent":"sale",
				  "redirect_urls":{
				    "return_url":clienthost+"v1/orders/"+ cat+ "/confirm?status=success&currency=usd&netprice=10&apikey="+apikey,
				    "cancel_url":clienthost+"v1/orders/"+ cat+ "/confirm?status=failure&currency=usd&netprice=10&apikey="+apikey
				  },
				  "payer":{
				    "payment_method":"paypal"
				  },
				  "transactions":[
				    {
				      "amount":{
				        "total":"10",
				        "currency":"USD"
				      }
				    }
				  ]
				};
	paymentreq.on('error',function(e){
		console.log(e);
	});
	paymentreq.write(JSON.stringify(data));

	paymentreq.end();
}