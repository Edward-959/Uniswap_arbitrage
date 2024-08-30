var Web3 = require('web3');
var ethers = require('ethers');
var BN = ethers.BigNumber;
var fs = require('fs');
var abis = require('../utils/abis')
var providers = require('../utils/provider');
var addresses = require('../utils/addresses');
const{dataWash} = require('../src/utils');
var bn = require('bignumber.js');
var math = require('math.js')


async function start(){
    let env = 'arbitrum'

    let uniswapPairList = JSON.parse(fs.readFileSync('./arbitrum_data/pair_list/main_pair_list.json', 'utf8'))
    const web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]))
    const uniswapPairAbi = abis['UNISWAP_V2_PAIR']
    const weth = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1'
    const usdt = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'
    const usdc = '0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8'
    const dai = '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1'
    let topList = []

    let blackList = []

    // uniswapPairList.length
    for (let i = 0 ; i < uniswapPairList.length; i++){
        console.log('已完成' + i + '/' + uniswapPairList.length + '个交易对获取')
        let uniswapPairAddress = uniswapPairList[i]
        let uniswapPair = new web3.eth.Contract(uniswapPairAbi, uniswapPairAddress)
        let reserves = await uniswapPair.methods.getReserves().call()
        let token0 = await uniswapPair.methods.token0().call()
        let token1 = await uniswapPair.methods.token1().call()
        if ((token0 == weth || token0 == usdc || token0 == usdt || token0 == dai)&& (inArray(token1, blackList) == false)){
            if (token0 == weth){
                if (BN.from(reserves['_reserve0']).gt(BN.from('1000000000000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
            if (token0 == dai){
                if (BN.from(reserves['_reserve0']).gt(BN.from('2000000000000000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
            if (token0 == usdt){
                if (BN.from(reserves['_reserve0']).gt(BN.from('2000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
            if (token0 == usdc){
                if (BN.from(reserves['_reserve0']).gt(BN.from('2000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }

        }
        else if ((token1 == weth || token1 == usdc || token1 == usdt || token1 == dai) &&(inArray(token0, blackList) == false)){
            if (token1 == weth){
                if (BN.from(reserves['_reserve1']).gt(BN.from('1000000000000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
            if (token1 == dai){
                if (BN.from(reserves['_reserve1']).gt(BN.from('2000000000000000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
            if (token1 == usdt){
                if (BN.from(reserves['_reserve1']).gt(BN.from('2000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
            if (token1 == usdc){
                if (BN.from(reserves['_reserve1']).gt(BN.from('2000000000'))){
                    topList.push(uniswapPairAddress)
                }
            }
        }
        else if ((inArray(token0, blackList) == false) && ((inArray(token1, blackList) == false))){
            if (BN.from(reserves['_reserve1']).gt(BN.from('1000000000000000000')) || 
                BN.from(reserves['_reserve0']).gt(BN.from('1000000000000000000'))){
                topList.push(uniswapPairAddress)
            }
        }

    }
    let newArr = JSON.stringify(topList)
    fs.writeFileSync('./arbitrum_data/pair_list/main_pair_list1.json', newArr, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
    process.exit(1)
}



function inArray(search, array){
    for (let i = 0; i < array.length; i++){
        if (array[i] == search){
            return true
        }
    }
    return false
}

async function getPairList(){
    env = 'arbitrum'
    const web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]))
    const batchQueryAbi = abis['BATCH_QUERY']
    const factoryAbi = abis['UNISWAP_V2_FACTORY']
    const batchQueryAddress = addresses[env]['aaveBatchQueryAddress']
    const sushiswapV2FactoryAddress = addresses[env]['sushiswapFactory']
    
    let sushiswapFactory = new web3.eth.Contract(factoryAbi, sushiswapV2FactoryAddress)
    let batchQuery = new web3.eth.Contract(batchQueryAbi, batchQueryAddress)

    let sushiPairLength = await sushiswapFactory.methods.allPairsLength().call()

    let sushiswapPairList = [] 
    
    let step = 3000
    let loopNum = math.round(sushiPairLength / step + 0.5)
    for(let i = 0; i < loopNum; i++){
        let loopStart = i * step
        let loopEnd = (i + 1) * step - 1 <= sushiPairLength - 1 ? ((i + 1)  * step) - 1: sushiPairLength - 1
        let tempList = await batchQuery.methods.uniswapV2PoolBatchQuery(sushiswapV2FactoryAddress, loopStart, loopEnd).call()
        sushiswapPairList = sushiswapPairList.concat(tempList)
        console.log(i)
    }

    let newArr1 = JSON.stringify(sushiswapPairList)
    fs.writeFileSync('./arbitrum_data/sushiswap_pairs.json', newArr1, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
    process.exit(1)
}


start()