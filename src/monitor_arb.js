var ethers = require('ethers');
var BN = ethers.BigNumber;
var bn = require('bignumber.js');
var fs = require('fs')
var Web3 = require('web3');
var addresses = require('../utils/addresses');
var abis = require('../utils/abis');
var providers = require('../utils/provider');
const{dataWash5} = require('./utils');

(init = async ()=> {
    let env = 'arbitrum'
    // let dataDir = './data/main_pair_array1.json'
    // let pairsInfo = JSON.parse(fs.readFileSync(dataDir, 'utf8'))
    let pairDir = './arbitrum_data/pair_list/main_pair_list.json'
    let routesDir = './arbitrum_data/path/path5_result1.json'
    let pathDir = './arbitrum_data/path/path5_result1.json'
    let pairList = JSON.parse(fs.readFileSync(pairDir, 'utf8'))
    let routes = JSON.parse(fs.readFileSync(routesDir, 'utf8'))
    let paths = JSON.parse(fs.readFileSync(pathDir, 'utf8'))
    routes = routes[0]
    paths = paths[2]
    let tokenIn = {'address': '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', 'decimals': 18}
    
    let web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]));
    const ethersWSChainProvider = new ethers.providers.WebSocketProvider(providers[env])
    var aaveBatchQuery = new web3.eth.Contract(abis['BATCH_QUERY'], addresses[env]['aaveBatchQueryAddress'])
    let lock = false

    ethersWSChainProvider.on("block",  async(blockNumber, err) =>{
        if (lock == false){
            lock = true
            console.log('Block ' + blockNumber.toString() + ': downloading pair data')
            let result = await aaveBatchQuery.methods.uniswapV2PairsBatchQuery(pairList).call()
            let pairsInfo = dataWash5(result, pairList)
            console.log('Block ' + blockNumber.toString() + ': calculating best trade')
            let bestTrades = findRouteArb(routes, pairsInfo, paths, tokenIn)
            console.log('Block ' + blockNumber.toString() + ': best profit is ' + bestTrades['profit'].toString())
            console.log('Block ' + blockNumber.toString() + ': best path is ' + bestTrades['path'])
            lock = false
        }
    })

})

function findArb(pairsInfo, tokenIn, tokenOut, maxHops, currentPairs, path, bestTrades){
    for(let i = 0; i < pairsInfo.length; i ++){

        let tempOut = {}
        let newPath = Object.assign([], path)
        let pair = pairsInfo[i]

        if (pairsInfo[i]['token0'] != tokenIn['address'] && pairsInfo[i]['token1'] != tokenIn['address']){
            continue
        }
        // console.log(pair['pair'])
        if ((BN.from(pairsInfo[i]['reserve0']).div(BN.from((10**pairsInfo[i]['decimals0']).toString()))).lte(BN.from(1)) || 
            (BN.from(pairsInfo[i]['reserve1']).div(BN.from((10**pairsInfo[i]['decimals1']).toString()))).lte(BN.from(1))){
            continue
        }

        if(pairsInfo[i]['token0'] == tokenIn['address']){
            tempOut['address'] = pairsInfo[i]['token1']
            tempOut['decimals'] = pairsInfo[i]['decimals1']
        }
        else{
            tempOut['address'] = pairsInfo[i]['token0']
            tempOut['decimals'] = pairsInfo[i]['decimals0']
        }
        newPath.push(tempOut['address'])
        if (tempOut['address'] == tokenOut['address'] && path.length > 2){
            let tempCurrentPairs = currentPairs.concat(pair)
            let result = getEaEb(tokenOut, tempCurrentPairs)
            let ea = result[0]
            let eb = result[1]
            let newTrade = {}
            newTrade = {'route': tempCurrentPairs, 'path': newPath, 'ea': ea, 'eb': eb}//
            if (ea.gt(BN.from(0)) && eb.gt(BN.from(0)) && ea.lt(eb)){
                newTrade ['optimalAmount'] = getOptimalAmount(ea, eb)
                newTrade['outputAmount'] = getAmountOut(newTrade['optimalAmount'], ea, eb)
                // newTrade['outputAmount'] = getAmountOutByPath(weth, newTrade ['optimalAmount'], tempCurrentPairs)
                newTrade['profit'] = newTrade['outputAmount'].sub(newTrade['optimalAmount'])
                newTrade['p'] = newTrade['profit'].div(BN.from((10**tokenOut['decimals']).toString()))
                
            }
            else{
                continue
            }
            if ((newTrade['profit'].gt(bestTrades['profit'])) && (newTrade['optimalAmount'].gt(BN.from('0')))){
                bestTrades = Object.assign({}, newTrade)
            }
        }
        else if (maxHops > 1 && pairsInfo.length > 1){
            let pairsInfoWithOutMe = Object.assign([], pairsInfo)
            pairsInfoWithOutMe = removeValue(pairsInfoWithOutMe, pair)
            let tempCurrentPairs = currentPairs.concat(pair)
            bestTrades = findArb(pairsInfoWithOutMe, tempOut, tokenOut, maxHops - 1, tempCurrentPairs, newPath, bestTrades)
        }
    }

    return bestTrades
}

function findRouteArb(routes, pairsInfo, paths, tokenIn){
    let bestTrades = {'profit': BN.from(0)}
    for(let i = 0; i < routes.length; i ++){
        let tempCurrentPairs = []
        let route = routes[i]
        for (let j = 0; j < route.length; j++){
            tempCurrentPairs = tempCurrentPairs.concat(pairsInfo[route[j]])
        }
        let result = getEaEb(tokenIn, tempCurrentPairs)
        let ea = result[0]
        let eb = result[1]
        let newTrade = {}
        newTrade = {'route': tempCurrentPairs,  'path': paths[i], 'ea': ea, 'eb': eb}//
        if (ea.gt(BN.from(0)) && eb.gt(BN.from(0)) && ea.lt(eb)){
            newTrade ['optimalAmount'] = getOptimalAmount(ea, eb)
            newTrade['outputAmount'] = getAmountOut(newTrade['optimalAmount'], ea, eb)
            // newTrade['outputAmount'] = getAmountOutByPath(weth, newTrade ['optimalAmount'], tempCurrentPairs)
            newTrade['profit'] = newTrade['outputAmount'].sub(newTrade['optimalAmount'])
        }
        else{
            continue
        }
        if ((newTrade['profit'].gt(bestTrades['profit'])) && (newTrade['optimalAmount'].gt(BN.from('0')))){
            bestTrades = Object.assign({}, newTrade)
        }
    }
    return bestTrades
}

function findRoutes(pairsInfo, tokenIn, tokenOut, maxHops, currentPairs, currentTypes, path, totalRoute, totalPath, totalType){
    for(let i = 0; i < pairsInfo.length; i ++){

        let tempOut = {}
        let newPath = Object.assign([], path)
        let pair = pairsInfo[i]

        if (pairsInfo[i]['token0'] != tokenIn['address'] && pairsInfo[i]['token1'] != tokenIn['address']){
            continue
        }
        // console.log(pair['pair'])
        if ((BN.from(pairsInfo[i]['reserve0']).div(BN.from((10**pairsInfo[i]['decimals0']).toString()))).lte(BN.from(1)) || 
            (BN.from(pairsInfo[i]['reserve1']).div(BN.from((10**pairsInfo[i]['decimals1']).toString()))).lte(BN.from(1))){
            continue
        }

        if(pairsInfo[i]['token0'] == tokenIn['address']){
            tempOut['address'] = pairsInfo[i]['token1']
            tempOut['decimals'] = pairsInfo[i]['decimals1']
        }
        else{
            tempOut['address'] = pairsInfo[i]['token0']
            tempOut['decimals'] = pairsInfo[i]['decimals0']
        }
        newPath.push(tempOut['address'])
        if (tempOut['address'] == tokenOut['address'] && path.length > 2){
            let tempCurrentPairs = currentPairs.concat(pair['pair'])
            let tempCurrentTypes = currentTypes.concat(pair['type'])
            totalRoute.push(tempCurrentPairs)
            totalPath.push(newPath)
            totalType.push(tempCurrentTypes)
        }
        else if (maxHops > 1 && pairsInfo.length > 1){
            let pairsInfoWithOutMe = Object.assign([], pairsInfo)
            pairsInfoWithOutMe = removeValue(pairsInfoWithOutMe, pair)
            let tempCurrentPairs = currentPairs.concat(pair['pair'])
            let tempCurrentTypes = currentTypes.concat(pair['type'])
            let result = findRoutes(pairsInfoWithOutMe, tempOut, tokenOut, maxHops - 1, tempCurrentPairs, tempCurrentTypes, newPath, totalRoute, totalPath, totalType)
            totalPath = result[1]
            totalRoute = result[0]
            totalType = result[2]
        }
    }
    return [totalRoute, totalPath, totalType]
}




function removeValue(array, val) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === val) {
        array.splice(i, 1);
        i--;
      }
    }
    return array;
  }


function getEaEb(tokenIn, pairs){
    let ea
    let eb
    const bn1000 = BN.from('1000')
    const bn997 = BN.from('997')
    let tokenOut = Object.assign({}, tokenIn)
    let idx = 0
    for (let i = 0 ; i < pairs.length; i ++){
        let pair = pairs[i]
        if (idx == 0){
            if (tokenIn['address'] == pair['token0']){
                tokenOut['address'] = pair['token1']
                tokenOut['decimals'] = pair['decimals1']
            } 
            else{
                tokenOut['address'] = pair['token0']
                tokenOut['decimals'] = pair['decimals0']
            }
        }

        if (idx == 1){
            let ra = pairs[0]['reserve0']
            let rb = pairs[0]['reserve1']
            if (tokenIn['address'] == pairs[0]['token1']){
                let temp = ra
                ra = rb
                rb = temp
            }
            let rb1 = pair['reserve0']
            let rc = pair['reserve1']
            if (tokenOut['address'] == pair['token1']){
                let temp = rb1
                rb1 = rc
                rc = temp
                tokenOut['address'] = pair['token0']
                tokenOut['decimals'] = pair['decimals0']
            }
            else{
                tokenOut['address'] = pair['token1']
                tokenOut['decimals'] = pair['decimals1']
            }
            ea = (BN.from(ra).mul(BN.from(rb1)).mul(bn1000)).div((bn1000.mul(BN.from(rb1))).add(BN.from(rb).mul(bn997)))
            eb = (bn997.mul(BN.from(rb)).mul(BN.from(rc))).div((bn1000.mul(BN.from(rb1))).add(bn997.mul(BN.from(rb))))
        }
        if(idx > 1){
            let ra = ea
            let rb = eb
            let rb1 = pair['reserve0']
            let rc = pair['reserve1']
            if (tokenOut['address'] == pair['token1']){
                let temp = rb1
                rb1 = rc
                rc = temp
                tokenOut['address']  = pair['token0']
                tokenOut['decimals'] = pair['decimals0']
            }
            else{
                tokenOut['address'] = pair['token1']
                tokenOut['decimals'] = pair['decimals1']
            }
            ea = (BN.from(ra).mul(BN.from(rb1)).mul(bn1000)).div((bn1000.mul(BN.from(rb1))).add(BN.from(rb).mul(bn997)))
            eb = (bn997.mul(BN.from(rb)).mul(BN.from(rc))).div((bn1000.mul(BN.from(rb1))).add(bn997.mul(BN.from(rb))))
        }
        idx = idx + 1
    }
    return [ea, eb]
}

function getAmountOutByPath(tokenIn, amountIn, pairs){
    let amountOut = JSON.parse(JSON.stringify(amountIn))
    let tokenOut = Object.assign({}, tokenIn)
    for (let i = 0 ; i < pairs.length; i ++ ){
        let pair =  pairs[i]
        if (pair['token0'] == tokenOut['address']){
            tokenOut['address'] = pair['token1']
            tokenOut['decimals'] = pair['decimals1']
            amountOut = getAmountOut(amountOut, pair['reserve0'], pair['reserve1'])
        }
        else if (pair['token1'] == tokenOut['address']){
            tokenOut['address'] = pair['token0']
            tokenOut['decimals'] = pair['decimals0']
            amountOut = getAmountOut(amountOut, pair['reserve1'], pair['reserve0'])
        }
    }
    return amountOut
}

function getOptimalAmount(ea, eb){
    const bn1000 = BN.from('1000')
    const bn997 = BN.from('997')
    let amount
    if(ea.gt(eb)){
        return null
    }
    else{
        amount = (sqrt(ea.mul(eb).mul(bn1000).mul(bn997)).sub(ea.mul(bn1000))).div(bn997)
    }
    return amount
}

function sqrt(value){
    return BN.from(new bn(value.toString()).sqrt().toFixed().split('.')[0])
  }

function getAmountOut(amountIn, reserveIn, reserveOut){
    const bn1000 = BN.from('1000')
    const bn997 = BN.from('997')
    let amount
    if(BN.from(amountIn).lt(BN.from(0)) || BN.from(reserveIn).lt(BN.from(0)) || BN.from(reserveOut).lt(BN.from(0))){
        return BN.from(0)
    }  
    else{
        amount = (bn997.mul(BN.from(reserveOut)).mul(amountIn)).div((bn1000.mul(BN.from(reserveIn))).add(bn997.mul(amountIn)))
    }
    return amount
}

init()
