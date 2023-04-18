import fetch from 'node-fetch';
const { JSDOM } = require('jsdom');

const url_base = "https://dicio.com.br/";

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    // another common pattern
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    )
    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }
    return await fn(req, res)
}


async function asyncFetch(url) {
    const htmlText = await fetch(url);

    const html = await dicioParser(await htmlText.text());

    return html;
}

async function asyncGetProp(element, attr) {
    try {
        // return await element.getProperty(attr); // usando puppeteer
        return element[attr]; // usando JSDOM
    } catch (error) {
        // console.log(error);
        return null;
    }
}

async function querySelectorAll(page, selector) {
    try {
        // return await page.$$(selector); // usando puppeteer
        return page.querySelectorAll(selector); // usando JSDOM
    } catch (error) {
        return [];
    }
}

async function querySelector(page, selector) {
    try {
        // return await page.waitForSelector(selector); // usando puppeteer

        return page.querySelector(selector); // usando JSDOM

    } catch (error) {
        return null;
    }
}

function replaceTags(str, string = "") {
    return str.replace(/(<([^>]+)>)/ig, string);
}


//<h2 class="tit-significado">  //
//<p itemprop="description" class="significado textonovo">  //
//<span class="cl">  --  tipo principal palavra  //
//<span>  --  definição  //
//<span class="tag">  --  tipos secundários //
//<span class="etim">  --  Etimologia  //
//<p class="adicional sinonimos"> -- sinonimos, são separados por <a>
//<p class="adicional">  -- definição simples
//<div class="frases">   ---  frases
//<div class="fonte">  -- fonte da frase
//<div class="frase">  --  frase
//<em>  -- proverbios?

async function dicioParser(htmlText) {
    const dom = new JSDOM(htmlText)
    const page = dom.window.document;
    let palavra = await querySelector(page, "div.title-header > h1")
    palavra = await asyncGetProp(palavra, "innerHTML"); //usando JSDOM
    let match = palavra.match(/\s{2,}[A-Za-zÀ-ÖØ-öø-ÿ]+\s{2,}/g);
    if (!match) return { status_code: 400, erro: "Não foi possivel encontar uma página com a palavra desejada" }
    palavra = match[0].replace(/\s/g, "")
    let significados = [];
    let sinonimos = [];
    let frases = [];
    let sinonimosEL = await querySelectorAll(page, "p.adicional a");
    let frasesEL = await querySelectorAll(page, "div.frases > div.frase");
    let significadosEl = await querySelectorAll(page, "p.significado > span");

    if (significadosEl?.length > 0) {
        for (let i = 0; i < significadosEl.length; i++) {
            const element = significadosEl[i];
            let innerText = await asyncGetProp(element, "innerHTML"); // usando JSDOM
            let class_Token = await asyncGetProp(element, "classList");
            let class_array = class_Token ? class_Token.value.split(/\s{2,}/g) : [];
            /*
            * primeira tentativa de regex pra tags
             .replace(/(\s*<\/?[span]+\s*?[a-zA-z=]+(\"?\'?)*[a-zA-z=]*(\"?\'?)*>\s?)+/g, "[split]")
            */

            let innerTextSplit = replaceTags(innerText, "[split]")
                .split("[split]");
            if (innerTextSplit.length > 1) {
                innerTextSplit.shift();
                class_array.push(innerTextSplit[0])
            }
            if (class_array.length == 0) class_array.push("definicao");

            significados.push({ classificacao: class_array, definicao: innerTextSplit[innerTextSplit.length - 1] });

        }
    }

    if (sinonimosEL?.length > 0) {
        for (let i = 0; i < sinonimosEL.length; i++) {
            const element = sinonimosEL[i];
            let innerText = await asyncGetProp(element, "innerHTML"); // usando JSDOM

            sinonimos.push({ palavra: innerText });

        }
    }


    if (frasesEL?.length > 0) {
        for (let i = 0; i < frasesEL.length; i++) {
            const element = frasesEL[i];
            let innerText = await asyncGetProp(element, "innerHTML"); // usando JSDOM
            let split = innerText
                .replace(/(\n\s{2,})+/g, "")
                .replace("<br>", "")
                .replace("<em>", "[split]")
                .split("[split]");

            if (split.length > 1) split[1] = replaceTags(split[1]).replace(/\s{2,}/g, "");
            split[0] = replaceTags(split[0]);
            split[0] = split[0].replace(palavra, "<b>" + palavra + "</b>").replace(/\s{2,}/g, "");

            frases.push({ autor: split[1], frase: split[0] });

        }
    }


    if (sinonimos.length == 0 && significados.length == 0 && frases.length == 0) {
        return { status_code: 404, erro: "Palavra não encontrada" }
    } else {
        return { palavra: palavra, significados: significados, sinonimos: sinonimos, frases: frases };

    }



}

async function getWord(word) {
    try {
        const url = url_base + word;
        const response = await asyncFetch(url);
        return response;
    } catch (error) {
        console.log(error);
        return {
            status_code: 400, erro: `Ocorreu um erro ao procurar ${word}:. ${error}`
        }
    };

}

async function handler(req, res) {
    const word = req.query.word;
    if (!word) {
        res.json({ status_code: 404, erro: "Palavra para busca não encontrada" })
    }
    let result = await getWord(word);
    res.status(result?.status_code ?? 200).json(result);
}



// module.exports = { getWord, dicioParser, asyncGetProp, asyncReturnJson, jsonToArr, querySelectorAll, querySelector, replaceTags };
module.exports = allowCors(handler) 