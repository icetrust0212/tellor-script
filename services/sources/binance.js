const axios = require("axios");
const { SYMBOL } = require("../../configs");

const getPrice = async () => {
  try {
    const price = (
      await axios.get("https://api.binance.com/api/v3/ticker/price", {
        params: {
          symbol: `${SYMBOL}USDT`,
        },
      })
    ).data.price;
    return Number(price);
  } catch (e) {
    return 0;
  }
};

module.exports = {
  getPrice,
};
