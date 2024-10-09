const ethers = require("ethers");
const config = require("../configs");
const TellorFlexABI = require("../abis/TellorFlex.json");
const Tellor360ABI = require("../abis/Tellor360.json");
const TellorMagicABI = require("../abis/TellorMagic.json");
const {
  FlashbotsBundleProvider,
} = require("@flashbots/ethers-provider-bundle");

// const wssProvider = new ethers.providers.WebSocketProvider(config.WSS_URL);
const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);
const signer = new ethers.Wallet(config.PV_KEY, provider);
// const authSigner = new ethers.Wallet(
//   config.FLASHBOT_SIGNER_KEY,
// );

const TellorMagic = new ethers.Contract(
  config.MAGIC_ADDRESS,
  TellorMagicABI,
  signer
)

const TellorFlex = new ethers.Contract(
  config.ORACLE_ADDRESS,
  TellorFlexABI,
  signer
);

const Tellor360 = new ethers.Contract(
  config.TOKEN_ADDRESS,
  Tellor360ABI,
  signer,
);

const getReserveInContract = async () => {
  return Number(await TellorFlex.getTotalTimeBasedRewardsBalance()) / 10 ** 18;
};

const getReporterInfo = async (addr) => {
  let stakerInfo = await TellorFlex.getStakerInfo(addr);
  return {
    stakeAmount: Number(stakerInfo[1]) / 10 ** 18,
    lastTimestamp: Number(stakerInfo[4]),
  };
};

const getLastestSubmissionTimestamp = async () => {
  return Number(await TellorFlex.timeOfLastNewValue());
};

const getNonce = async () => {
  return Number(await TellorFlex.getNewValueCountbyQueryId(config.QUERY_ID));
};

const submitValue = async (price) => {
  console.log(
    new Date().toLocaleTimeString("it-IT"),
    `Submitting the value as ${price} ...`
  );

  try {
    const tx = await TellorMagic.submitValue(
      config.QUERY_ID,
      ethers.utils.hexZeroPad(ethers.utils.parseEther(price.toString()), 32),
      await getNonce(),
      config.QUERY_DATA
    );

    await tx.wait()
  } catch (e) {
    console.log(e)
  }
  // try {
  //   const flashbotsProvider = await FlashbotsBundleProvider.create(
  //     provider,
  //     authSigner
  //   );
  //   const blockNumber = await provider.getBlockNumber();
  //   let gasPrice = Number(await provider.getGasPrice());
  //   const tx = await TellorFlex.submitValue(
  //     config.QUERY_ID,
  //     ethers.utils.hexZeroPad(ethers.utils.parseEther(price.toString()), 32),
  //     await getNonce(),
  //     config.QUERY_DATA,
  //   );

  //   let actualGas = parseInt(gasPrice * 5);
  //   let priorityFee = parseInt(gasPrice * (Math.random() * 0.2 + 1.1));
  //   console.log(gasPrice / 10 ** 9, actualGas / 10 ** 9, priorityFee / 10 ** 9);
  //   const bundleSubmitResponse = await flashbotsProvider.sendBundle([
  //     {
  //       signer: signer,
  //       transaction: {
  //         chainId: 1,
  //         type: 2,
  //         ...tx,
  //         maxFeePerGas: ethers.BigNumber.from(actualGas),
  //         maxPriorityFeePerGas: ethers.BigNumber.from(priorityFee),
  //         // gasPrice: ethers.BigNumber.from(actualGas),
  //       },
  //     },
  //   ], blockNumber + 1);

  //   // By exiting this function (via return) when the type is detected as a "RelayResponseError", TypeScript recognizes bundleSubmitResponse must be a success type object (FlashbotsTransactionResponse) after the if block.
  //   if ('error' in bundleSubmitResponse) {
  //     console.warn(bundleSubmitResponse.error.message)
  //     return
  //   }

  //   console.log(await bundleSubmitResponse.simulate())

  //   // await tx.wait();
  // } catch (e) {
  //   console.log(e);
  // }
};

const mintToOracle = async () => {
  console.log(
    new Date().toLocaleTimeString("it-IT"), "Minting to oracle...");
  const tx = await Tellor360.mintToOracle();
  await tx.wait();
}

const getAvailableEarning = async () => {
  const currentTimestamp = Math.floor(new Date() / 1000);

  return (currentTimestamp - (await getLastestSubmissionTimestamp())) / 600;
};

const getRemainedLockTime = async (address = config.MAGIC_ADDRESS) => {
  const { stakeAmount, lastTimestamp } = await getReporterInfo(address);
  const currentTimestamp = Math.floor(new Date() / 1000);

  if (stakeAmount < 100) {
    console.log("Insufficient Balance");
  }
  return Math.floor((12 * 3600 * 100) / stakeAmount) -
    currentTimestamp +
    lastTimestamp

};

filter = {
  address: config.TOKEN_ADDRESS,
};

// wssProvider.on(filter, async (txHash) => {
//   console.log(new Date().toLocaleTimeString("it-IT"), txHash);
// });

module.exports = {
  getReserveInContract,
  getReporterInfo,
  getLastestSubmissionTimestamp,
  getNonce,
  submitValue,
  getRemainedLockTime,
  getAvailableEarning,
  mintToOracle,
};
