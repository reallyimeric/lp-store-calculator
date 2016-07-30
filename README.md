lp-store-calculator
===================

A calculator for loyalty point store in EVE-Online

## Features

- Auto calculate lp / isk ratio, to help you make choice when exchanging loyalty points.

## Before running

`git clone https://github.com/reallyimeric/lp-store-calculator.git` and `npm install `
- Package `xlsx` is not required if database is ready.

## Usage

`node main.js` then just watch the console output ...

## Note
- If you are running it for the first time, prepare the database first. You can download items data (excel) from [EVE國服市場中心](http://www.ceve-market.org/api/), unzip it, keep the xlsx file in the same directory with converter.js, and `node ./converter.js` to convert it into sqlite database;
- Items not included in database (such as "万王宝座海军型蓝图") will be added when queried, with id = null; so that you should add price information by yourself right now;
- Some items can not be sold on the market, you also need to set price for them.
- You can set a huge number at "time" column to prevent calculator querying/updating price information.

------------

still under working...
