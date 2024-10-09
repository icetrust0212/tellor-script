const config = require("../configs");
const { ethers } = require('ethers');
const ARIMA = require('arima');
const { reporterQuery, reportersQuery } = require('../utils/queries')
const { ApolloClient, InMemoryCache } = require('@apollo/client/core')
const Tellor360ABI = require("../abis/Tellor360.json");
const { getRemainedLockTime } = require('./web3');

const provider = new ethers.providers.JsonRpcProvider(config.RPC_URL);

const contractAddress = config.TOKEN_ADDRESS;
const contract = new ethers.Contract(contractAddress, Tellor360ABI, provider);

const eventName = 'Transfer'; // Replace with the name of your event

async function getHistory() {
  const clientMainnet = new ApolloClient({
    uri: 'https://gateway-arbitrum.network.thegraph.com/api/ad08435a6d6c0933c9e272dbdfa21322/subgraphs/id/5vJKyvzkSDv6kc5vCbyohvXq1KgCczsSVr58jUaPih6S',
    cache: new InMemoryCache(),
  })

  const { data } = await clientMainnet.query({ query: reporterQuery, variables: { queryId: config.QUERY_ID } })
  const { newReportEntities } = data
  return newReportEntities
}

async function getReporters() {
  const clientMainnet = new ApolloClient({
    uri: 'https://api.studio.thegraph.com/query/64305/tellorstakers/version/latest',
    cache: new InMemoryCache()
  })

  const { data } = await clientMainnet.query({ query: reportersQuery })
  const { stakerEntities } = data

  return stakerEntities
}

async function getCompetitorRewardsHistory() {
  let reporters = await getReporters()
  const entities = await getHistory()

  let uReporters = []
  for (let reporter of reporters) {
    uReporters.push({ ...reporter, amount: reporter.amount / 10 ** 18, duration: Math.floor((12 * 3600 * 100) / reporter.amount), remainTime: await getRemainedLockTime(reporter.id) })
  }

  uReporters = uReporters.filter(reporter => reporter.remainTime <= 120 && reporter.remainTime >= -3600)

  const eventFilter = contract.filters[eventName](config.ORACLE_ADDRESS);
  const blockNumber = await provider.getBlockNumber();
  const logs = await contract.queryFilter(eventFilter, blockNumber - 50000)

  const rewardHistory = []
  for (let reporter of uReporters) {
    rewardHistory.push(logs.filter(log => log.args[1]?.toLowerCase() === reporter.id.toLowerCase() && log.args?.[2] / 10 ** 18 >= 0.3).map(log => (log.args?.[2] / 10 ** 18).toFixed(2)))
  }

  return rewardHistory
}

function getPredictableValue(recentTrends) {
  const arima = new ARIMA({ p: 1, d: 1, q: 1, verbose: false }).train(recentTrends)
  const nextValue = arima.predict(10)[0].reduce((sum, cur) => sum + cur, 0) / 10;
  return nextValue;
}

async function getRecentTrendsAndNumberOfThieves() {
  // Simulated values for demonstration
  const blockNumber = await provider.getBlockNumber();
  const logs = await contract.queryFilter(eventFilter, blockNumber - 50000)
  const recentTrends = logs.filter(log => log.args[0]?.toLowerCase() === config.ORACLE_ADDRESS.toLowerCase()).map(value => Number(value.args[2] / 10 ** 18))

  console.log(recentTrends)
  const numberOfThieves = Math.floor(Math.random() * 5) + 1; // Random number of thieves between 1 and 5
  return [recentTrends, numberOfThieves];
}

async function getThreshold() {
  const rewardsHistory = await getCompetitorRewardsHistory()

  const predictPriceArray = rewardsHistory.map(hArray => getPredictableValue(hArray))

  return Math.min(...predictPriceArray)
}

module.exports = {
  getRecentTrendsAndNumberOfThieves,
  getThreshold
}