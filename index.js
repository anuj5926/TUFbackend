const Redis = require("ioredis");
const express = require('express');
const mongoose = require('mongoose');
const CodeModel = require('./model');

require('dotenv').config();
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

// const client = createClient({
//     password: 'Y9MvYrpRHI8KaQ4kEKm0gcWY3xh522CQ',
//     socket: {
//         host: 'redis-13159.c326.us-east-1-3.ec2.cloud.redislabs.com',
//         port: 13159
//     }
// });

const redis = new Redis({
    port: 13159, // Redis port
    host: "redis-13159.c326.us-east-1-3.ec2.cloud.redislabs.com", // Redis host
    username: "default", // needs Redis >= 6
    password: "Y9MvYrpRHI8KaQ4kEKm0gcWY3xh522CQ"
});

redis.on("message", (channel, message) => {
    console.log(`Received ${message} from ${channel}`);
});

mongoose.connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

app.post('/data', (req, res) => {
    try {
        const jsonData = req.body;
        console.log(jsonData);

        const newCode = new CodeModel(jsonData);

        newCode.save()
            .then(savedCode => {
                console.log('Code saved to MongoDB:', savedCode);
                redis.rpush("userData", JSON.stringify(jsonData));
                res.status(200).json({ message: 'Data received' });
            })
            .catch(err => {
                console.error('Error saving code:', err);
                res.status(400).json({ error: err });
            });
    } catch (error) {
        console.error('Error parsing JSON:', error);
        res.status(400).json({ error: 'Invalid JSON' });
    }
});
app.get('/senddata', async (req, res) => {

    redis.llen('userData', async (err, len) => {
        console.log("object",len)
        if (err) {
            console.error('Redis error:', err);
        } else if (len > 0) {
            const data = await redis.lrange("userData", 0, -1, (err, data) => {
                if (err) {
                    console.error(err);
                } else {
                    const parsedData = data.map(jsonString => JSON.parse(jsonString));
                    console.log('Retrieved data from Redis list:');
                    // console.log('Retrieved data from Redis list:', parsedData);
                    // res.status(200).json({ parsedData:parsedData });
                    res.status(200);
                    res.send(json({parsedData:parsedData}));
                }
            });
        } else {
            try {
                console.log('Retrieved data from mongodb');
                const allCodeData = await CodeModel.find({});
                console.log(allCodeData);
                allCodeData.map(jsonString => redis.rpush("userData",JSON.stringify(jsonString)));
                // res.status(200).json({ parsedData:allCodeData });
                res.status(200);
                res.send(json({parsedData:allCodeData}));
            } catch (error) {
                reject(error);
                res.status(400).json({ error });
            }
        }
    });

});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});