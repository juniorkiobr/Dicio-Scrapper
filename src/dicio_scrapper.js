const { default: puppeteer } = require('puppeteer');
const { JSDOM } = require('jsdom');

const url_base = "https://dicio.com.br/";
var browser = null;


async function asyncFetch(url) {
    const page = await browser.newPage();
    await page.goto(url);
    await page.setViewport({ width: 1080, height: 1024 });
    // const html = await page.;
    const html = await dicioParser(page);
    // await browser.close();
    return html;
}

async function asyncGetProp(element, attr) {
    return await element.getProperty(attr);
}

async function asyncReturnJson(element) {
    // o jsonValue é para remover do handler e ficar somente o text

    if (element instanceof Promise) {
        return await (await element).jsonValue();
    }
    return await element.jsonValue();

}

async function jsonToArr(json) {
    return Object.keys(json).map((key) => {
        return json[Number(key)];
    });
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

async function dicioParser(page) {
    let significados = [];
    let sinonimos = [];
    let frases = [];
    let significadoEl = await page.waitForSelector("p.significado");
    let sinonimosEL = await page.$$("p.adicional a");
    let frasesEL = await page.$$("div.frases > div.frase");
    let significadosEl = await significadoEl.$$("span");

    // frases.push({ fonte: fraseAutorEL ? await asyncReturnJson(asyncGetProp(fraseAutorEL, "innerHTML")) : "Desconhecido" })

    console.log(significadosEl.length, sinonimosEL.length, frasesEL.length);

    for (let i = 0; i < significadosEl.length; i++) {
        const element = significadosEl[i];
        let innerText = await asyncReturnJson(asyncGetProp(element, "innerHTML"))
        let class_json = await asyncReturnJson(asyncGetProp(element, "classList"))
        let class_array = await jsonToArr(class_json);

        significados.push({ class: class_array, texto: innerText });

    }

    for (let i = 0; i < sinonimosEL.length; i++) {
        const element = sinonimosEL[i];
        let innerText = await asyncReturnJson(asyncGetProp(element, "innerHTML"))

        sinonimos.push({ palavra: innerText });

    }

    for (let i = 0; i < frasesEL.length; i++) {
        const element = frasesEL[i];
        let innerText = await asyncReturnJson(asyncGetProp(element, "innerHTML"))
        let split = innerText
            .replace(/(\n {2,})+/g, "")
            .split("<br>");

        frases.push({ autor: split[1], frase: split[0] });

    }

    if (sinonimos.length == 0 && significados.length == 0 && frases.length == 0) {
        return { status_code: 400, erro: "Palavra não encontrada" }
    } else {
        return { significados, sinonimos, frases };

    }



}

async function getWord(word) {
    try {
        browser = await puppeteer.launch();
        const url = url_base + word;
        const html = await asyncFetch(url);
        await browser.close();
        return html;
    } catch (error) {
        console.log(error);
        return { status_code: 400, erro: error }
    };

}



module.exports = { getWord };