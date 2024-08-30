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
    let uniswapPairList = JSON.parse(fs.readFileSync('./data/uniswapV3_pool.json', 'utf8'))
    const web3 = new Web3(new Web3.providers.WebsocketProvider(providers[env]))
    const uniswapPairAbi = abis['UNISWAP_V2_PAIR']
    const tokenAbi = abis['IERC20']
    const weth = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
    const usdt = '0xdAC17F958D2ee523a2206206994597C13D831ec7'
    const usdc = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    const dai = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
    let topList = [[], [], [], [], [], []]
    let blackList = [	"0x86FADb80d8D2cff3C3680819E4da99C10232Ba0F",
                        "0x4D13d624a87baa278733c068A174412AfA9ca6C8",
                        "0x0e511Aa1a137AaD267dfe3a6bFCa0b856C1a3682",
                        "0x4922a015c4407F87432B179bb209e125432E4a2A",
                        "0xD46bA6D942050d489DBd938a2C909A5d5039A161",
                        "0xd233D1f6FD11640081aBB8db125f722b5dc729dc",
                        "0x88EF27e69108B2633F8E1C184CC37940A075cC02", 
                        "0x81a8bd7f2b29cEE72aAe18dA9B4637acf4Bc125A"
                    ]
    // uniswapPairList[0].length
    for (let i = 0 ; i < uniswapPairList[0].length; i++){
        console.log('已完成' + i + '/' + uniswapPairList[0].length + '个交易对获取')
        let uniswapPairAddress = uniswapPairList[0][i]
        let uniswapPair = new web3.eth.Contract(uniswapPairAbi, uniswapPairAddress)
        // let reserves = await uniswapPair.methods.getReserves().call()
        let token0 = await uniswapPair.methods.token0().call()
        let token1 = await uniswapPair.methods.token1().call()
        let token0Contract = new web3.eth.Contract(tokenAbi, token0)
        let token1Contract = new web3.eth.Contract(tokenAbi, token1)
        let balance0 = await token0Contract.methods.balanceOf(uniswapPairAddress).call()
        let balance1 = await token1Contract.methods.balanceOf(uniswapPairAddress).call()
        let decimals0 = await token0Contract.methods.decimals().call()
        let decimals1 = await token0Contract.methods.decimals().call()
        if ((token0 == weth || token0 == usdc || token0 == usdt || token0 == dai)&& (inArray(token1, blackList) == false)){
            if (token0 == weth){
                if (BN.from(balance0).gt(BN.from('1000000000000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
            if (token0 == dai){
                if (BN.from(balance0).gt(BN.from('2000000000000000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
            if (token0 == usdt){
                if (BN.from(balance0).gt(BN.from('2000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
            if (token0 == usdc){
                if (BN.from(balance0).gt(BN.from('2000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }

        }
        else if ((token1 == weth || token1 == usdc || token1 == usdt || token1 == dai) &&(inArray(token0, blackList) == false)){
            if (token1 == weth){
                if (BN.from(balance1).gt(BN.from('1000000000000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
            if (token1 == dai){
                if (BN.from(balance1).gt(BN.from('2000000000000000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
            if (token1 == usdt){
                if (BN.from(balance1).gt(BN.from('2000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
            if (token1 == usdc){
                if (BN.from(balance1).gt(BN.from('2000000000'))){
                    topList[0].push(uniswapPairAddress)
                    topList[1].push(uniswapPairList[1][i])
                    topList[2].push(uniswapPairList[2][i])
                    topList[3].push(uniswapPairList[3][i])
                    topList[4].push(decimals0)
                    topList[5].push(decimals1)
                }
            }
        }
        else if ((inArray(token0, blackList) == false) && ((inArray(token1, blackList) == false))){
            if (BN.from(balance1).gt(BN.from('1000000000000000000000')) || 
                BN.from(balance0).gt(BN.from('1000000000000000000000'))){
                topList[0].push(uniswapPairAddress)
                topList[1].push(uniswapPairList[1][i])
                topList[2].push(uniswapPairList[2][i])
                topList[3].push(uniswapPairList[3][i])
                topList[4].push(decimals0)
                topList[5].push(decimals1)
            }
        }

    }
    let newArr = JSON.stringify(topList)
    fs.writeFileSync('./data/uniswapV3_pool_1.json', newArr, 'utf8', (err) =>{
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


start()