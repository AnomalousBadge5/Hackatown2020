const { ServiceBusClient, ReceiveMode } = require("@azure/service-bus"); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://licenseplatepublisher.servicebus.windows.net/;SharedAccessKeyName=ConsumeReads;SharedAccessKey=VNcJZVQAVMazTAfrssP6Irzlg/pKwbwfnOqMXqROtCQ=";
const topicName = "licenseplateread"; 
const subscriptionName = "rVgrUNqGNtv7jVvU"; 

async function main(){
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString); 
  const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName);
  const receiver = subscriptionClient.createReceiver(ReceiveMode.receiveAndDelete);
  var XHR = new XMLHttpRequest();

  try {
    const messages = await receiver.receiveMessages(10);
    for(var i = 0; i < messages.length; i++) {
      var aEnvoyer = {
        LicensePlateCaptureTime: messages[i].body.LicensePlateCaptureTime,
        LicensePlate: messages[i].body.LicensePlate,
        Latitude: messages[i].body.Latitude,
        Longitude: messages[i].body.Longitude
      };
      console.log(aEnvoyer);
      XHR.open('POST', 'https://licenseplatevalidator.azurewebsites.net/api/lpr/platelocation', true, "equipe43", "WFynQsLZ3u7PYv22");

      XHR.setRequestHeader("Authorization", "Basic ZXF1aXBlNDM6V0Z5blFzTFozdTdQWXYyMg==");
      XHR.send(aEnvoyer.toString());
    }

    await subscriptionClient.close();
  } finally {
    await sbClient.close();
  }
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});

