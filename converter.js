'use strict'
const xlsx = require('xlsx')
const sqlite3 = require('sqlite3')
const fs = require('fs')
let fileName = './items.xls'
try {
  let stats = fs.statSync(fileName)
  if (!stats.isFile()) {throw 'not file'}
} catch(err) {
  try {
    fileName = '數據資料表.xls'
    let stats = fs.statSync(fileName)
    if (!stats.isFile()) {throw 'not file'}
  } catch(err) {
    console.error('File "items.xls"/"數據資料表.xls" not existed?')
    process.exit(1)
  }
}

const source = xlsx.readFile(fileName)
const sheet0 = source.Sheets[source.SheetNames[0]]
const target = new sqlite3.Database('./items.sqlite', commonErrorHandler)
const tableName = 'items'

target.serialize()
target.run('PRAGMA journal_mode = OFF', commonErrorHandler)
target.run(`CREATE TABLE "main"."${tableName}" (
  "id" INTEGER UNIQUE ,
  "name" TEXT ,
  "price" REAL ,
  "time" INTEGER DEFAULT 0)
  `, err => {
  if ( err ) {
    console.err('does the table already exist?')
    console.err('halt')
    process.exit(1)
  }
})
const statement = target.prepare(`INSERT INTO ${tableName} (id, name) VALUES (?1, ?2)`)
target.parallelize()
console.log('Start...')
const timestamp = new Date().getTime()

const maxRowString = sheet0['!ref'].split(":").pop().replace(/[A-Z]+/,'')
const maxRow = Number.parseInt(maxRowString, 10)

for (let index = 2; index !== maxRow + 1; index++) {
  const id = sheet0[`A${index}`].v
  const name = sheet0[`B${index}`].v
  statement.run(id, name, commonErrorHandler)
}

target.serialize()
statement.finalize()
target.close(() => console.log(`Database time cost: ${(new Date().getTime() - timestamp)/1000}s`))

function commonErrorHandler(err){
  if (err) {
    console.error(`${err}`)
    process.exit(1)
  }
}
