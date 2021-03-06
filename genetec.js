const { ServiceBusClient, ReceiveMode} = require("@azure/service-bus"); 
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

// Define connection string and related Service Bus entity names here
const connectionString = "Endpoint=sb://licenseplatepublisher.servicebus.windows.net/;SharedAccessKeyName=ConsumeReads;SharedAccessKey=VNcJZVQAVMazTAfrssP6Irzlg/pKwbwfnOqMXqROtCQ=";
const topicName = "licenseplateread"; 
const subscriptionName = "rVgrUNqGNtv7jVvU"; 
const connectionStringMAJ = "Endpoint=sb://licenseplatepublisher.servicebus.windows.net/;SharedAccessKeyName=listeneronly;SharedAccessKey=w+ifeMSBq1AQkedLCpMa8ut5c6bJzJxqHuX9Jx2XGOk=";
const topicNameMAJ = "wantedplatelistupdate"; 
const subscriptionNameMAJ = "crqmTfDyHPjseYvz"; 

async function main(){
  const sbClient = ServiceBusClient.createFromConnectionString(connectionString); 
  const subscriptionClient = sbClient.createSubscriptionClient(topicName, subscriptionName);
  const receiver = subscriptionClient.createReceiver(ReceiveMode.receiveAndDelete);
  const sbClientMAJ = ServiceBusClient.createFromConnectionString(connectionStringMAJ); 
  const subscriptionClientMAJ = sbClientMAJ.createSubscriptionClient(topicNameMAJ, subscriptionNameMAJ);
  const receiverMAJ = subscriptionClientMAJ.createReceiver(ReceiveMode.receiveAndDelete);
  var XHR = new XMLHttpRequest();
  var XHRMAJ = new XMLHttpRequest();

  try {



    var plates = getPlates();
    var messagesMAJ;
    var notifDeMiseAjour = false;
    while(true) {
      const messages = await receiver.receiveMessages(10);
      if(notifDeMiseAjour == false) {
        messagesMAJ = receiverMAJ.receiveMessages(1).then(function(value) {
          if(messagesMAJ[0] != undefined) {
            plates = getPlates(XHR);
            messagesMAJ[0] = undefined;
          }
          notifDeMiseAjour = false;
        });
        notifDeMiseAjour = true;
      }

      if(plates != undefined && messages != undefined) {
        console.log("Vérification des paires de plaques et messages");
        for (var j = 0; j < plates.length; j++) {
          for (var i = 0; i < messages.length; i++) {
            if (plates[j] == messages[i].body.LicensePlate) {
              XHR.open('POST', 'https://licenseplatevalidator.azurewebsites.net/api/lpr/platelocation', true, "equipe43", "WFynQsLZ3u7PYv22");
              XHR.setRequestHeader("Authorization", "Basic ZXF1aXBlNDM6V0Z5blFzTFozdTdQWXYyMg==");
              console.log("envoi de donnees: ");
              console.log(plates[j]);
              XHR.send(JSON.stringify(messages[i].body));
            }
          }
        }
      }
    }
  } finally {
    await sbClient.close();
  }
}

main().catch((err) => {
  console.log("Error occurred: ", err);
});

function getPlates() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://licenseplatevalidator.azurewebsites.net/api/lpr/wantedplates', false, "equipe43", "WFynQsLZ3u7PYv22");
  xhr.setRequestHeader("Authorization", "Basic ZXF1aXBlNDM6V0Z5blFzTFozdTdQWXYyMg==");
  xhr.send('');
  return  JSON.parse(xhr.responseText);
}