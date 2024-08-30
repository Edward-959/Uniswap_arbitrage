var Web3 = require('web3');
var ethers = require('ethers');
var BN = ethers.BigNumber;
var fs = require('fs');
var addresses = require('../utils/addresses');
var abis = require('../utils/abis')
var providers = require('../utils/provider');
const{dataWash} = require('../src/utils');
var bn = require('bignumber.js');

async function start(){
    let env = 'mainnet'
    let web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]));
    let curveRegistry = new web3.eth.Contract(abis['CURVE_POOL_REGISTRY'], addresses['mainnet']['curvePoolRegistry'])
    let poolCount = await curveRegistry.methods.pool_count().call()
    let curvePool = {}
    for (let i = 0; i < poolCount; i ++){
        console.log(i + '/' + poolCount)
        let address = await curveRegistry.methods.pool_list(i).call()
        curvePool[address] = {}
        let tokenCounts = await curveRegistry.methods.get_n_coins(address).call()
        let tokens = await curveRegistry.methods.get_coins(address).call()
        let decimals = await curveRegistry.methods.get_decimals(address).call()
        let reserves = await curveRegistry.methods.get_balances(address).call()
        tokenCounts = tokenCounts[0]
        for (let j = 0; j < tokenCounts; j++){
            let tokenName = 'token' + j
            let decimalName = 'decimals' + j
            let reserveName = 'reserve' + j
            curvePool[address][tokenName] = tokens[j]
            curvePool[address][decimalName] = decimals[j]
            curvePool[address][reserveName] = reserves[j]
        }
        curvePool[address]['type'] = 2
        curvePool[address]['pair'] = address
        console.log(curvePool)
    }

    let newArr = JSON.stringify(curvePool)
    fs.writeFileSync('./data/curve/pair_list.json', newArr, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
    process.exit(1)
}

async function start1(){
    let env = 'mainnet'
    let web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]));
    let curveRegistry = new web3.eth.Contract(abis['CURVE_POOL_REGISTRY'], addresses['mainnet']['curvePoolRegistry'])
    let poolCount = await curveRegistry.methods.pool_count().call()
    let curvePool = []
    for (let i = 0; i < poolCount; i ++){
        console.log(i + '/' + poolCount)
        let address = await curveRegistry.methods.pool_list(i).call()
        tempCurve = {}
        let tokenCounts = await curveRegistry.methods.get_n_coins(address).call()
        let tokens = await curveRegistry.methods.get_coins(address).call()
        let decimals = await curveRegistry.methods.get_decimals(address).call()
        let reserves = await curveRegistry.methods.get_balances(address).call()
        tokenCounts = tokenCounts[0]
        for (let j = 0; j < tokenCounts; j++){
            let tokenName = 'token' + j
            let decimalName = 'decimals' + j
            let reserveName = 'reserve' + j
            tempCurve[tokenName] = tokens[j]
            tempCurve[decimalName] = decimals[j]
            tempCurve[reserveName] = reserves[j]
        }
        tempCurve['type'] = 2
        tempCurve['pair'] = address
        tempCurve['tokenCounts'] = +tokenCounts
        curvePool.push(tempCurve)
        console.log(tempCurve)
    }

    let newArr = JSON.stringify(curvePool)
    fs.writeFileSync('./data/curve/pair_list1.json', newArr, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
    process.exit(1)
}

start1()
