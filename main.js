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
//const addStatement = target.prepare(`INSERT INTO ${tableName} (name) VALUES(?1)`)
const setStatement = target.prepare(`UPDATE ${tableName} SET price=?2,time=${new Date().getTime()} WHERE name = ?1`)
const fetch = require('node-fetch')
target.run('PRAGMA journal_mode = OFF')

gallenteProposals.forEach(calculate)

function calculate(proposal) {//console.log(proposal);
  let price = getInfo(proposal.prize).catch(err => console.error(`[Error while getInfo ("${proposal.prize}")]: ${err}`))
    .then(priceof).catch(err => console.error(`[Error while priceof ("${proposal.prize}")]: ${err}`))
    .then(unitPrice => unitPrice * proposal.quantity)
    .catch(err => console.error(`[Error while "${proposal.prize}"]: ${err}`))
  let itemCostAll = 0       //Insteading of the old "itemCost", “itemCostAll” is now the price of all the required items
  const itemCostPromises = proposal.require.map(costCal)
  Promise.all(itemCostPromises).then(itemCosts => {
    itemCosts.forEach(itemCost => itemCostAll + itemCost)     //now "itemCost" is an element of array "itemCosts"
    let cost = proposal.isk + itemCostAll
    let lpRatio = price.then(price => proposal.lp / ((price - cost) / 100000000 ))
    lpRatio.then(lpRatio => console.log(`${proposal.prize}*${proposal.quantity} lp: ${proposal.lp} Ratio:${lpRatio}`))
  })
}

function costCal(requiredItem){
  return getInfo(requiredItem.name).catch(err => console.error(`[Error while getInfo]: ${err}`))
    .then(priceof).catch(err => console.error(`[Error while priceof]: ${err}`))
    .then(price => price * requiredItem.quantity)
}

function priceof(record){
  //if (record == null) console.log('!!!!!!!!!!!!!!!!')
  let id = record.id
  if (new Date().getTime() - record.time < 1000*600) {
    if (record.price == 0) console.error(`[Warning]: price of "${record.name}" is 0, please consider setting a proper value and time`)
    return Promise.resolve(record.price)
  }
  if (id != null){
    let url = `http://www.ceve-market.org/api/market/region/10000002/type/${id}.json`
    return fetch(url).catch(err => console.error(`[Error while fetch]: ${err}`))
      .then(result => result.json()).catch(err => console.error(`[Error while json]: ${err}`))
      .then(result => result.sell.min)
      .then(price => {
        setStatement.run(record.name, price, err => {if (err) console.error(`setStatement failed while setting "${record.name}": ${err}`)} )
        if (price == 0) console.error(`[Warning]: price of "${record.name}" is 0, please consider setting a proper value and time`)
        return price
      })
  }
  else{
    console.error(`[Warning]: ${record.name} does not have an id: set a proper value and time`)
    return Promise.resolve(record.price)
  }
}
function getInfo(name){//console.log(name)
  return new Promise((resolve, reject) => {
    getStatement.get(name, (err, record) => {
      // if (record == null) {
      //   console.error(`[Warning]: ${name} not found, inserting...`)
      //   addStatement.run(name, err => {if (err) console.error(`addStatement failed while adding "${name}": ${err}`)} )
      // }
      if ( err || (record == null) ) {
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
