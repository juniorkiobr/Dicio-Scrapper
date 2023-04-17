const app = require('express')();
// import { v4 as uuidv4 } from 'uuid';
// const { v4: uuidv4 } = require('uuid');

// app.get('/api', (req, res) => {
//     const path = `/api/word/banana`;
//     res.setHeader('Content-Type', 'text/html');
//     res.setHeader('Cache-Control', 's-max-age=1, stale-while-revalidate');
//     res.end(`Hello! Go to item: <a href="${path}">${path}</a>`);
// });


// app.get('/api/item/:slug', (req, res) => {
//     const { slug } = req.params;
//     res.end(`Item: ${slug}`);
// });

// app.get('/api/word/:palavra', (req, res) => {
//     const { palavra } = req.params;
//     res.end(`Palavra: ${palavra}`);
// });

app.get('/dicio', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 's-max-age=9000, stale-while-revalidate');

    res.end('You are in the root of the API, go to /dicio/word/:word to get the word');
});

app.get('/dicio/word/:word', async (req, res) => {
    res.setHeader('Content-Type', 'text/json');
    res.setHeader('Cache-Control', 's-max-age=9000, stale-while-revalidate');
    const word = req.params.word;
    if (!word) return res.send('No word provided');
    const data = await scrapper.getWord(word);
    res.end(data);
});

module.exports = app;