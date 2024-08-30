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
    let uniswapPairList = JSON.parse(fs.readFileSync('./data/top_200_pair_list.json', 'utf8'))
    let top100tokens = JSON.parse(fs.readFileSync('./data/top_100_tokens.json', 'utf8'))
    let top200tokens = JSON.parse(fs.readFileSync('./data/top_200_tokens.json', 'utf8'))
    let topTokens = top100tokens.concat(top200tokens)
    const web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]))
    const uniswapPairAbi = abis['UNISWAP_V2_PAIR']
    const coreCoin = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                        '0x6B175474E89094C44Da98b954EedeAC495271d0F']
    let topArrays = {}

    for (let i = 0; i < topTokens.length; i ++){
        if (inArray(topTokens[i], coreCoin) == false){
            topArrays[topTokens[i]] = []
        }

    }
    // uniswapPairList.length
    for (let i = 0; i < uniswapPairList.length; i ++){
        console.log(i + "/" + uniswapPairList.length)
        let uniswapPairAddress = uniswapPairList[i]
        let uniswapPair = new web3.eth.Contract(uniswapPairAbi, uniswapPairAddress)
        let token0 = await uniswapPair.methods.token0().call()
        let token1 = await uniswapPair.methods.token1().call()
        if (topArrays[token0] != null){
            topArrays[token0].push(uniswapPairAddress)
        }
        else if (topArrays[token1] != null){
            topArrays[token1].push(uniswapPairAddress)
        }

    }

    let newArr = JSON.stringify(topArrays)
    fs.writeFileSync('./data/top_arrays.json', newArr, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
    process.exit(1)


}

function filter(){
    let uniswapPairArray = JSON.parse(fs.readFileSync('./data/top_arrays.json', 'utf8'))
    let top100tokens = JSON.parse(fs.readFileSync('./data/top_100_tokens.json', 'utf8'))
    let top200tokens = JSON.parse(fs.readFileSync('./data/top_200_tokens.json', 'utf8'))
    let topTokens = top100tokens.concat(top200tokens)
    const coreCoin = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
                    '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
                    '0x6B175474E89094C44Da98b954EedeAC495271d0F']
    let pairList = []
    for (let i = 0; i < topTokens.length; i ++){
        if((inArray(topTokens[i], coreCoin) == false)){
            if ((uniswapPairArray[topTokens[i]].length >= 2)){
                pairList = pairList.concat(uniswapPairArray[topTokens[i]])
            }
        }

    }
    pairList = [...new Set(pairList)]
    let newArr = JSON.stringify(pairList)
    fs.writeFileSync('./data/top_200_pair_list.json', newArr, 'utf8', (err) =>{
        console.log('写入成功', err)
    })
}

function inArray(search, array){
    for (let i = 0; i < array.length; i++){
        if (array[i] == search){
            return true
        }
    }
    return false
}

filter()