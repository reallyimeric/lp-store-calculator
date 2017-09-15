lp-store-calculator
===================

A calculator for loyalty point store in EVE-Online

## Features

- Auto calculate lp / isk ratio, to help you make choice when exchanging loyalty points.

## Before running

Clone and install dependencies.

```
git clone https://github.com/reallyimeric/lp-store-calculator.git
npm install
```

> Package `xlsx` is not required if database is ready, so you can use `npm install --production`.

## Usage

`node main.js` and then just watch the console output ...

## Note
- Please prepare the database before first run. You can download items data (excel) from [EVE國服市場中心](http://www.ceve-market.org/api/), unzip it, keep the xlsx file in the same directory with converter.js, and run `node converter.js` to convert it into the required sqlite database;
> You can rename xlsx file to either `數據資料表.xls` or `items.xls`.
- Items not included in database (such as "万王宝座海军型蓝图") will be added when queried, with id = null; so that you should add price information by yourself right now;
- Some items can not be sold on the market, you also need to set price for them.
- You can set a huge number at "time" column to prevent calculator querying/updating price information.

------------

This project is not under active development.