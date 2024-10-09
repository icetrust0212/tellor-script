const { REWARD_THRESHOLD } = require("../configs/index.js");
const binance = require("./sources/binance.js");
const {
  getRemainedLockTime,
  getAvailableEarning,
  getReserveInContract,
  submitValue,
  mintToOracle,
} = require("../helpers/web3.js");
const { getThreshold } = require('../helpers/reward.js');

const ONE_MIN = 1000 * 60;

const run = async () => {
  const lockTime = Math.max(0, await getRemainedLockTime());
  if (lockTime) {
    console.log(`Sleep for ${Math.floor(lockTime / 3600)} hr ${Math.floor(lockTime / 60) % 60} min ${lockTime % 60} seconds ...`);
    setTimeout(() => {
      run();
    }, lockTime * 1000);
  } else {
    handleSubmit();
  }
};

const handleSubmit = async () => {
  try {
    const currentEarning = await getAvailableEarning();
    const reserve = await getReserveInContract();

    console.log("Available Earning is", currentEarning);
    console.log("### Reserve", reserve);
    let REWARD_THRESHOLD = await getThreshold();

    if (currentEarning < REWARD_THRESHOLD) {
      setTimeout(() => {
        handleSubmit();
      }, parseInt((REWARD_THRESHOLD - currentEarning) * ONE_MIN * 10));
    } else {
      let price = await binance.getPrice();
      if (!price) {
        setTimeout(() => {
          handleSubmit();
        }, ONE_MIN / 2);
      } else {
        // submit the value
        if (reserve < currentEarning) {
          if (currentEarning > 3) {
            await mintToOracle();
            await submitValue(price);
          }
          setTimeout(() => {
            run();
          }, parseInt(ONE_MIN));
        }
        else {
          await submitValue(price);
          setTimeout(() => {
            run();
          }, ONE_MIN);
        }
      }
    }
  } catch (e) {
    console.log(e);
    setTimeout(() => {
      handleSubmit();
    }, ONE_MIN);
  }
};

run();
