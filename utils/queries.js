const { gql } = require('@apollo/client/core')

const reportersQuery = gql`
  query {
    stakerEntities(where: {amount_not: "0"}) {
      amount
      id
    }
  }
`
const reporterQuery = gql`
  query($queryId: String!) {
    newReportEntities(where: {
        _queryId: $queryId,
      }, 
      orderBy: _time, 
      orderDirection: desc
    ) {
      id
      _nonce
      _queryData
      _queryId
      _time 
      _value
      _reporter
      txnHash
    }
  }
`

const reporterWRewardQuery = gql`
  query {
    newReportEntities(orderBy: _time, orderDirection: desc) {
      id
      _nonce
      _queryData
      _queryId
      _reward
      _time
      _value
      _reporter
      txnHash
    }
  }
`

const autopayQuery = gql`
  query {
    dataFeedFundedEntities(orderBy: id, orderDirection: desc) {
      id
      _queryId
      _feedId
      _amount
      _feedFunder
    }
    newDataFeedEntities(orderBy: id, orderDirection: desc) {
      id
      _queryId
      _feedId
      _queryData
      _feedCreator
    }
    oneTimeTipClaimedEntities(orderBy: id, orderDirection: desc) {
      id
      _queryId
      _amount
      _reporter
    }
    tipAddedEntities(orderBy: id, orderDirection: desc) {
      id
      _queryId
      _amount
      _queryData
      _tipper
      _startTime
      txnHash
    }
    tipClaimedEntities(orderBy: id, orderDirection: desc) {
      id
      _feedId
      _queryId
      _amount
      _reporter
    }
    dataFeedEntities(orderBy: id, orderDirection: desc) {
      id
      _reward
      _startTime
      _interval
      _window
      _priceThreshold
      _queryData
      _balance
      txnHash
    }
    
  }
`

const divaPayQuery = gql`
  query {
    pools(orderBy: id, orderDirection: desc) {
      id
      referenceAsset
      dataProvider
      settlementFee
      expiryTime
      collateralBalanceGross
      collateralToken {
        id
        name
        symbol
        decimals
      }
    }

    feeRecipients(orderBy: id, orderDirection: desc) {
    id
    collateralTokens {
      amount
      collateralToken {
        id
        name
        symbol
        decimals
      }
    }
    }
  }
`


const divaPayAdaptorQuery = gql`
    query {
      tipAddeds(orderBy: id, orderDirection: desc) {
        id
        poolId
        tippingToken
        amount
        tipper
        blockNumber
        blockTimestamp
        transactionHash
    }
  }
`

module.exports = {
  reportersQuery,
  reporterQuery,
  divaPayQuery,
  divaPayAdaptorQuery,
  autopayQuery,
  reporterWRewardQuery
}