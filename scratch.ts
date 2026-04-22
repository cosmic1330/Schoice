import { fetchStockExtData } from "./src/tools/stockScraper";
fetchStockExtData("2330").then(console.log).catch(console.error);
