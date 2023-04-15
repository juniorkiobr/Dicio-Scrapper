const express = require('express');

const scrapper = require('./src/dicio_scrapper.js');

const app = express();
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
    console.log(`Example app listening at http://localhost:${port}`)
});

