const express = require('express');
const cors = require('cors');

const scrapper = require('./src/dicio_scrapper.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors())
const port = 3000;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.get('/word/:word', async (req, res) => {
    const word = req.params.word;
    const data = await scrapper.getWord(word);
    res.send(data);
});

app.listen(port, () => {
    console.log(`Example app listening at http://127.0.0.1:${port}`)
});

