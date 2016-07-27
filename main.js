"use strict"
const fs = require('fs')
// const amarrStorage = fs.readFileSync("./amarr.json")
// const amarrProposals = JSON.parse(amarrStorage)
// const caldariStorage = fs.readFileSync("./caldari.json")
// const caldariProposals = JSON.parse(caldariStorage)
const gallenteStorage = fs.readFileSync("./gallente.json", "utf-8")
const gallenteProposals = JSON.parse(gallenteStorage)
// const minmatarStorage = fs.readFileSync("./minmatar.json")
// const minmatarProposals = JSON.parse(minmatarStorage)
const sqlite3 = require('sqlite3')
const target = new sqlite3.Database("./items.sqlite", sqlite3.OPEN_READONLY)
const tableName = "items"
const statement = target.prepare(`SELECT * FROM ${tableName} WHERE name = ?`)
const fetch = require('node-fetch')

gallenteProposals.forEach(calculate)

function calculate(proposal) {
  let price = getInfo(proposal.prize).then(itemInfo => priceof(itemInfo)).then(unitPrice => unitPrice * proposal.quantity)
  let itemCost = 0
  const itemCostPromises = proposal.require.map(item => costCal(item))
  Promise.all(itemCostPromises).then(itemCosts => {
    itemCosts.forEach(item => itemCost + item)
    let cost = proposal.isk + itemCost
    let lpRatio = price.then(price => proposal.lp / ((price - cost) / 100000000 ))
    lpRatio.then(lpRatio => console.log(`${proposal.prize}*${proposal.quantity} lp: ${proposal.lp} Ratio:${lpRatio}`))
  })
}

function costCal(requiredItem){
  return getInfo(requiredItem).then(itemInfo => priceof(itemInfo)).then(price => price * requiredItem.quantity)
}

function priceof(record){
  let id = record.id
  let url = `http://www.ceve-market.org/api/market/region/10000002/type/${id}.json`
  return fetch(url)
    .then(result => result.json())
    .then(result => result.sell.min)
}
function getInfo(name){
  return new Promise((resolve, reject) => {
    statement.get(name, (err, record) => {
      if (err) {
        reject(err)
        return
      }
      resolve(record)
    })
  })
}

//let r = p.then((result) => result).then().then().result

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
