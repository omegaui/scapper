const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const writeStream = fs.createWriteStream('saudi_beverage.csv');
writeStream.write(`Brand,Title,Size,MRP,OfferPrice,Image,ShopId,ProductType,EAN,Title_ar,Category 1,Category 2,Category 3,Category_arr 1,Category_arr 2,Category_arr 3 \n`);
var tpProduct = ["https://www.carrefourksa.com/mafsau/en/malt-beverages/barbican-beer-raspberry-nrb-330ml/p/60926"];

fs.readFile("products_url.urls", 'utf8', (err, data) => {
    if (err) {
        console.log(err)
    } else {
        generateCSV(data)
    }
})

async function generateCSV(allUrls) {
    var urlList = allUrls.split("\n")
    var productLinks = [];
    urlList.forEach((url) => productLinks.push(url));
    console.log("Attempting to Retrieve Info of " + productLinks.length + " products ...")

    var accuracy = 0;
    var count = 0;
    var threshold = 50;

    for (var i = 0; i < productLinks.length - threshold; i += threshold) {
        await sleep(getRandomServerRestTimeForCollection())
        console.log("At Set: " + i + "->" + (i + threshold))
        var urlStack = productLinks.slice(i, i + threshold)
        accuracy += 1
        var stackAccuracy = 0;
        for (var x in urlStack) {
            count++
            var fullUrl = urlStack[x]
            console.log("Retrieving " + count + " ... " + fullUrl)
            var data = await getProductData(fullUrl);
            stackAccuracy++;
            try {
                if (data == undefined) {
                    accuracy--
                    stackAccuracy--
                    throw Error()
                }
                var dt = (data.props['initialProps']['pageProps']['initialData']['products'])
                var categories = dt[0].attributes.productCategoriesHearchi.split("/")
                categories = categories.slice(0, 3)
                var cat0_arr;
                var cat1_arr;
                for (var j = 0; j < 3; j++) {
                    cat0_arr = dt[0].attributes.categoriesHierarchy[0]["name_ar"]
                    cat1_arr = dt[0].attributes.categoriesHierarchy[1]["name_ar"]
                    cat2_arr = dt[0].attributes.categoriesHierarchy[2]["name_ar"]
                }
                writeStream.write(`${dt[0].attributes.brandName}, ${dt[0].title}, ${dt[0].attributes.size}, ${dt[0].offers[0].stores[0].price.original.value}, ${dt[0].offers[0].stores[0].price.original.value}, "${dt[0].media[1].url}",${dt[0].attributes.storeId},${dt[0].attributes.productType},${dt[0].attributes.barCodes}, ${dt[0].attributes.name_ar},${categories[0]},${categories[1]},${categories[2]},${cat0_arr},${cat1_arr},${cat2_arr}\n`);

            } catch (err) {
                console.log("[Failed] Url: " + fullUrl)
            }
        }
        console.log("Generated " + (count) + " out of " + productLinks.length + " Accuracy: " + ((stackAccuracy * 100) / threshold) + "%")
    }
    console.log("CSV Accuracy: " + ((accuracy * 100) / productLinks.length) + "%")
}

function getRandomServerRestTimeForCollection() {
    var threshold = Math.random() * 30 + 10;
    return threshold;
}

function getRandomServerRestTimeForProduct() {
    var threshold = Math.random() * 50 + 10;
    return threshold;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const getProductData = async (url) => {
    try {
        const response = await axios.get(url);
        const data = response.data;
        const $ = cheerio.load(data);
        const nextData = JSON.parse($('#__NEXT_DATA__').html());
        return nextData;
    } catch (error) {
        // console.log(error);
    }
};
