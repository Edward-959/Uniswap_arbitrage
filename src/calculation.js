var ethers = require('ethers');
var BN = ethers.BigNumber;
var bn = require('bignumber.js');
var fs = require('fs')


const bn1000 = BN.from('1000')
const bn997 = BN.from('997')
const weth = {'address': '0xdac17f958d2ee523a2206206994597c13d831ec7', 'decimals': 6}


    
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

function findRouteArb(routes, pairsInfo, tokenIn){
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
        newTrade = {'route': tempCurrentPairs,  'ea': ea, 'eb': eb}//
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

function findRoutes(pairsInfo, tokenIn, tokenOut, maxHops, currentPairs, currentTypes, path, routePathType){
    for(let i = 0; i < pairsInfo.length; i ++){

        let tempOut = {}
        let newPath = Object.assign([], path)
        let pair = pairsInfo[i]

        if (pair['token0'] != tokenIn['address'] && pair['token1'] != tokenIn['address']){
            continue
        }
        // console.log(pair['pair'])
        if ((BN.from(pair['reserve0']).div(BN.from((10**pair['decimals0']).toString()))).lte(BN.from(1)) || 
            (BN.from(pair['reserve1']).div(BN.from((10**pair['decimals1']).toString()))).lte(BN.from(1))){
            continue
        }


        if(pair['token0'] == tokenIn['address']){
            tempOut['address'] = pair['token1']
            tempOut['decimals'] = pair['decimals1']
        }
        else{
            tempOut['address'] = pair['token0']
            tempOut['decimals'] = pair['decimals0']
        }
        newPath.push(tempOut['address'])
        if (tempOut['address'] == tokenOut['address'] && 
            ((path.length >= 2))){
            let tempCurrentPairs = currentPairs.concat(pair['pair'])
            let tempCurrentTypes = currentTypes.concat(pair['type'])
            routePathType[0].push(tempCurrentPairs)
            routePathType[1].push(newPath)
            routePathType[2].push(tempCurrentTypes)
        }
        else if (maxHops > 1 && pairsInfo.length > 1){
            let pairsInfoWithOutMe = Object.assign([], pairsInfo)
            pairsInfoWithOutMe = removeValue(pairsInfoWithOutMe, pair)
            let tempCurrentPairs = currentPairs.concat(pair['pair'])
            let tempCurrentTypes = currentTypes.concat(pair['type'])
            routePathType = findRoutes(pairsInfoWithOutMe, tempOut, tokenOut, maxHops - 1, tempCurrentPairs, tempCurrentTypes, newPath, routePathType)
            totalRoute = routePathType[0]
            totalPath = routePathType[1]
            totalType = routePathType[2]
        }
    }
    return routePathType
}

function findRoutes1(pairsInfo, tokenIn, tokenOut, maxHops, currentPairs, currentTypes, path, routePathType){
    for(let i = 0; i < pairsInfo.length; i ++){

        let tempOut = {}
        let newPath = Object.assign([], path)
        let pair = pairsInfo[i]
        let pairAddress = pair['pair']

        if (pair['token0'] != tokenIn['address'] && pair['token1'] != tokenIn['address'] 
            && pair['token2'] != tokenIn['address'] && pair['token3'] != tokenIn['address']){
            continue
        }
        // console.log(pair['pair'])
        if ((BN.from(pair['reserve0']).div(BN.from((10**pair['decimals0']).toString()))).lte(BN.from(1)) || 
            (BN.from(pair['reserve1']).div(BN.from((10**pair['decimals1']).toString()))).lte(BN.from(1))){
            continue
        }
        
        let length = pair['tokenCounts']
        for (let k = 0; k < length; k ++){
            newPath = Object.assign([], path)
            tempOut['address'] = pair['token' + k]
            tempOut['decimals'] = pair['decimals' + k]
            if((newPath[newPath.length-1] == tempOut['address'])){
                continue
            }
            newPath.push(tempOut['address'])
            if (tempOut['address'] == tokenOut['address'] && (path.length >= 2)){
                let tempCurrentPairs = currentPairs.concat(pair['pair'])
                let tempCurrentTypes = currentTypes.concat(pair['type'])
                routePathType[0].push(tempCurrentPairs)
                routePathType[1].push(newPath)
                routePathType[2].push(tempCurrentTypes)
            }
            else if ((maxHops > 1) && (pairsInfo.length > 1)){
                let pairsInfoWithOutMe = Object.assign([], pairsInfo)
                pairsInfoWithOutMe = removeValue(pairsInfoWithOutMe, pair)
                let tempCurrentPairs = currentPairs.concat(pair['pair'])
                let tempCurrentTypes = currentTypes.concat(pair['type'])
                routePathType = findRoutes1(pairsInfoWithOutMe, tempOut, tokenOut, maxHops - 1, tempCurrentPairs, tempCurrentTypes, newPath, routePathType)
                totalRoute = routePathType[0]
                totalPath = routePathType[1]
                totalType = routePathType[2]
            }
        }

        


    }
    return routePathType
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
    let amount
    if(BN.from(amountIn).lt(BN.from(0)) || BN.from(reserveIn).lt(BN.from(0)) || BN.from(reserveOut).lt(BN.from(0))){
        return BN.from(0)
    }  
    else{
        amount = (bn997.mul(BN.from(reserveOut)).mul(amountIn)).div((bn1000.mul(BN.from(reserveIn))).add(bn997.mul(amountIn)))
    }
    return amount
}



function test(){
    let dataDir = './data/top_200_list_array.json'
    // let dataDir = './data/main_pair_array2.json'
    let pairsInfo = JSON.parse(fs.readFileSync(dataDir, 'utf8'))

    let tokenIn = {'address': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'decimals': 18}
    let tokenOut = tokenIn
    let maxHops = 3
    let currentPairs = []
    let currentTypes = []
    let path = [tokenIn['address']]
    let routePathType = [[], [], []]

    routePathType = findRoutes1(pairsInfo, tokenIn, tokenOut, maxHops, currentPairs, currentTypes, path, routePathType)
    totalRoute = routePathType[0]
    totalPath = routePathType[1]
    totalType = routePathType[2]
    
    let resultList = []
    for (let i = 0; i < totalPath.length; i ++){
        resultList.push([totalRoute[i], totalType[i], totalPath[i]])
    }

    let resultList1 = [totalRoute, totalType, totalPath]    

    console.log(totalRoute.length)

    let newArr1 = JSON.stringify(resultList)
    fs.writeFileSync('./data/total_route3_1.json', newArr1, 'utf8', (err) =>{
        console.log('写入成功', err)
    })

    let newArr2 = JSON.stringify(resultList1)
    fs.writeFileSync('./data/total_path3_1.json', newArr2, 'utf8', (err) =>{
        console.log('写入成功', err)
    })

}   


function test2(){
    let dataDir = './data/best_trade.json'
    let tradeInfo = JSON.parse(fs.readFileSync(dataDir, 'utf8'))
    // let ea = tradeInfo['ea']
    // let eb = tradeInfo['eb']
    let optimalAmount = tradeInfo['optimalAmount']
    // let outputEaEb = getAmountOut(optimalAmount, ea, eb)
    // let profitEaEb = outputEaEb.sub(optimalAmount)
    // console.log(profitEaEb.toString())
    let route = tradeInfo['route']
    let [ea, eb] = getEaEb(weth, route)
    console.log(ea.toString())
    console.log(eb.toString())
    
    // let outputAmount = getAmountOutByPath(weth, optimalAmount, route)
    // let profit = outputAmount.sub(optimalAmount)
    // console.log(profit.toString())
    // optimalAmount = BN.from(optimalAmount['hex'])
    // // console.log(optimalAmount.toString())
    // let optimalAmountLess = optimalAmount.sub(BN.from(10**12))
    // // console.log(optimalAmountLess.toString())
    // let outputLess = getAmountOutByPath(weth, optimalAmountLess, route)
    // let profitLess = outputLess.sub(optimalAmountLess)
    // console.log(profitLess.toString())
    // let optimalAmountMore = optimalAmount.add(BN.from(10**12))
    // // console.log(optimalAmountMore.toString())
    // let outputMore = getAmountOutByPath(weth, optimalAmountMore, route)
    // let profitMore = outputMore.sub(optimalAmountMore)
    // console.log(profitMore.toString())
}

function test3(){
    let dataDir = './data/main_pair_array1.json'
    let pairsInfo = JSON.parse(fs.readFileSync(dataDir, 'utf8'))
    let routes = JSON.parse(fs.readFileSync('./data/total_route5.json', 'utf8'))
    let tokenIn = {'address': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'decimals': 18}
    let bestTrades = findRouteArb(routes, pairsInfo, tokenIn)
    console.log(bestTrades)
}

function test4(){
    let dataDir = './data/top_200_list_array.json'
    let pairsInfo = JSON.parse(fs.readFileSync(dataDir, 'utf8'))
    let tokenIn = {'address': '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', 'decimals': 18}
    let tokenOut = tokenIn
    let maxHops = 5
    let currentPairs = []
    let path = [tokenIn['address']]
    let bestTrades = {'profit': BN.from(0)}
    bestTrades = findArb(pairsInfo, tokenIn, tokenOut, maxHops, currentPairs, path, bestTrades)
    console.log(bestTrades['profit'].toString())
}   

function test5(){
    let dataDir = './data/main_pair_array2.json'
    let pairsInfo = JSON.parse(fs.readFileSync(dataDir, 'utf8'))
    for (let i = 0; i < pairsInfo.length; i ++){
        pairsInfo[i]['tokenCounts'] = 2
    }

    let newArr1 = JSON.stringify(pairsInfo)
    fs.writeFileSync('./data/main_pair_array2.json', newArr1, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
}


test()