'use strict'
const fs = require('fs')
// const amarrStorage = fs.readFileSync("./amarr.json")
// const amarrProposals = JSON.parse(amarrStorage)
// const caldariStorage = fs.readFileSync("./caldari.json")
// const caldariProposals = JSON.parse(caldariStorage)
const gallenteStorage = fs.readFileSync('./gallente.json', 'utf-8')
const gallenteProposals = JSON.parse(gallenteStorage)
// const minmatarStorage = fs.readFileSync("./minmatar.json")
// const minmatarProposals = JSON.parse(minmatarStorage)
const sqlite3 = require('sqlite3')
const target = new sqlite3.Database('./items.sqlite')
const tableName = 'items'
const getStatement = target.prepare(`SELECT * FROM ${tableName} WHERE name = ?`)
const setStatement = target.prepare(`UPDATE ${tableName} SET price=?2,time=${new Date().getTime()} WHERE name = ?1`)
const fetch = require('node-fetch')
target.run('PRAGMA journal_mode = OFF')

gallenteProposals.forEach(calculate)

function errorHandler(e){
  console.error(`${e.name}:${e.message}`)
}

function calculate(proposal) {
  const pricePromise = getSubtotal(proposal.prize, proposal.quantity)
  const requiredALLSubtotal = proposal.require.map(requiredItem => getSubtotal(requiredItem.name, requiredItem.quantity))
  const itemCostAllPromise = Promise.all(requiredALLSubtotal).then(requiredALLSubtotal => {
    let itemCostAll = 0       //Insteading of the old "itemCost", “itemCostAll” is now the price of all the required items
    requiredALLSubtotal.forEach(requiredItemSubtotal => itemCostAll += requiredItemSubtotal)
    return itemCostAll
  })
  let costPromise = itemCostAllPromise.then(itemCostAll => proposal.isk + itemCostAll)
  let lpRatioPromise = Promise.all([pricePromise, costPromise]).then(theArray => {
    const price = theArray[0]
    const cost = theArray[1]
    return proposal.lp / ((price - cost) / 100000000 ) //we use "亿"(or "E", 1亿 = 1E = 100M) instead of M
  })
  lpRatioPromise.then(lpRatio => {
    console.log(`${proposal.prize}*${proposal.quantity} lp: ${proposal.lp} Ratio:${lpRatio}`)
  })
  .catch(errorHandler)
}

function getSubtotal(name, quantity){
  return getInfo(name).then(getPrice).then(price => price * quantity)
}

function getPrice(record){
  function zeroPriceChecker(price){
    if (price == 0) throw new Error(`"${record.name}": price should never be 0; consider set a proper price/time value.`)
  }
  function timePassed(){
    return new Date().getTime() - record.time
  }
  let id = record.id
  if (timePassed() < 1000*600) {
    zeroPriceChecker(record.price)
    return Promise.resolve(record.price)
  }
  let url = `http://www.ceve-market.org/api/market/region/10000002/type/${id}.json`
  return fetch(url)
  .then(result => result.json())
  .then(result => result.sell.min)
  .then(price => {
    zeroPriceChecker(price)
    setStatement.run(record.name, price, err => {
      if (err) console.error(`Warning: "${record.name}": setStatement failed: ${err}`)
    })
    return price
  })
}

function getInfo(name){
  return new Promise((resolve, reject) => {
    getStatement.get(name, (err, record) => {
      if (err) {
        reject(`"${name}": getStatement failed: ${err}`)
        return
      }
      if (record === undefined) {
        reject(`"${name}": item not found in database`)
        return
      }
      resolve(record)
    })
  })
}

// example json :
//   {
//     "sell":
//     {
//       "volume":23585737756,
//       "max":1333.0,
//       "min":13.09
//     },
//     "all":
//     {
//       "volume":48516267266,
//       "max":1333.0,
//       "min":3.33
//     },
//     "buy":
//     {
//       "volume":24930529510,
//       "max":13.17,
//       "min":3.33
//     }
//   }
 //}
