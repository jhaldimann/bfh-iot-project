const mqtt = require('mqtt');
const Influx = require('influx')
var MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';

let prev = null;

// MQTT Part
const client = mqtt.connect('mqtt://192.168.1.143', {clientId: 'user'})

client.on('connect', function () {
    console.log("connected");
});

client.subscribe('data/temp', {qos: 0})

client.on('message', function (topic, message, packet) {
    getData(message);
});

const influx = new Influx.InfluxDB({
    host: '192.168.1.143',
    database: 'temp',
    schema: [
        {
            measurement: 'degrees',
            fields: {
                temp: Influx.FieldType.FLOAT,
            },
            tags: ['unit']
        }
    ]
});

let getData = (message) => {
    influx.query(`
        select *
        from degrees
        order by time desc limit 1`)
        .then(result => {
            let prev = result[0].temp
            if (message > prev - 1 && message < prev + 1) {
                pushData(message)
            }
        }).catch(err => {
        console.log(err)
    })
}

let pushData = (temp) => {
    insertItems(temp.toString());
    influx.writePoints([
        {
            measurement: 'degrees',
            fields: {
                temp: temp.toString()
            },
            timestamp: new Date().getTime(),
            tags: {
                unit: "degrees"
            }
        }
    ], {
        database: 'temp',
        precision: 'ms',
        epoch: "ms"
    })
        .catch(error => {
            console.error(`Error saving data to InfluxDB! ${error.stack}`)
        });
}


let insertItems = (temp) => {
    try {
        MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, function(err, db) {
            console.log('connected');
            let dbo = db.db('temp')
            let data = {temp: temp, timestamp: new Date().getTime()}
            dbo.collection("temp").insertOne(data, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
        });
    }catch(err) {
        console.log(err);
    }
}