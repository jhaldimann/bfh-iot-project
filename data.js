const fetch = require('node-fetch');
const mqtt = require('mqtt');

// MQTT Part
const client = mqtt.connect("mqtt://192.168.1.143", {clientId: "data"})
let counter = 0;

client.on("connect", function () {
    console.log("connected");
});

let sendData = () => {
    fetch('http://192.168.1.108/temp')
        .then(response => response.json())
        .then(data => {
            // Every 10th time send a fake value
            if (counter % 10 === 0) {
                let rand = Math.random() * (100 - 40) + 40;
                client.publish('data/temp', `${rand}`)
            } else {
                client.publish('data/temp', `${data.compensated}`)
            }
            counter++;
        });
}

setInterval(() => {
    sendData();
}, 5000);
