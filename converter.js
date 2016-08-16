"use strict"
const xlsx = require('xlsx')
const sqlite3 = require('sqlite3')
const source = xlsx.readFile('./數據資料表.xls')
const sheet0 = source.Sheets[source.SheetNames[0]]
const target = new sqlite3.Database("./items.sqlite", common_error_handler)
const tableName = "items"
const time = 0
const price = 0
target.serialize()
target.run("PRAGMA journal_mode = OFF", common_error_handler)
target.run(`CREATE TABLE "main"."${tableName}" (
  "id" INTEGER UNIQUE ,
  "name" TEXT ,
  "price" REAL ,
  "time" INTEGER DEFAULT 0)
  `, err => {
    if (err != null){
      if (err.errno == 1){ //or .....all error's errno are 1?
        console.log(`does the table already exist?`)
        console.log(`halt`)
        process.exit(1)
      }
    }
  })
const statement = target.prepare(`INSERT INTO ${tableName} (id, name) VALUES (?1, ?2)`)
target.parallelize()
const timestamp = new Date().getTime()
for (let index = 2; index != 17526 + 1 ; index++)
{
  let id = sheet0[`A${index}`].v
  let name
  try{name = sheet0[`B${index}`].v}catch(err){name = ''}
  statement.run(id, name, common_error_handler)
  // console.log(`${index} -- ${name} = ${id}`)
}
target.serialize()
statement.finalize()
target.close(() => console.log(`Database time cost: ${(new Date().getTime() - timestamp)/1000}s`))

function common_error_handler(err){
  if (err != null ) {
    console.log(`${err}`)
    process.exit(1)
  }
}
