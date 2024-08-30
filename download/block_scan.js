var Web3 = require('web3');
var fs = require('fs');
var math = require('math.js');
var abis = require('../utils/abis');

function inArray(search, array){
    for (var i in array){
        if (array[i] == search){
            return true
        }
    }
    return false
}

(async() =>{

    const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://eth-mainnet.g.alchemy.com/v2/'))

    // 监听aave合约的新borrow活动
    const uniswapV2Factory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
    // const sushiswapFactory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'

    var aaveInstance= new web3.eth.Contract(abis['UNISWAP_V2_FACTORY'], uniswapV2Factory)
    let dataDir = './data/top_200_tokens.json';
    let mainTokenList = JSON.parse(fs.readFileSync(dataDir, 'utf8'))

    let startBlock = 10000835
    // let latestBlock = 10020835
    // let startBlock = 16500000
    let latestBlock = 16584052
    let step = 1000
    let fromBlock
    let endBlock
    let mainPairList = []

    let loopNum = math.round((latestBlock - startBlock) / step + 0.5)

    let borrower1 = []
    for (i = 0; i < loopNum; i++){

        fromBlock = startBlock + i * step
        if (fromBlock + step < latestBlock){
            endBlock = fromBlock + step
        }
        else{
            endBlock = latestBlock
        }
        let options = {
            filter: {
                    //Only get events where transfer value was 1000 or 1337
            },
            fromBlock: fromBlock,                  //Number || "earliest" || "pending" || "latest"
            toBlock: endBlock
        };
    
        console.log(options['toBlock'])
        await aaveInstance.getPastEvents('PairCreated', options)
            .then(results => {
                
                for (k = 0; k < results.length; k++){
                    token0 = results[k]['returnValues']['token0']
                    token1 = results[k]['returnValues']['token1']
                    if (inArray(token0, mainTokenList) == true || inArray(token1, mainTokenList == true)){
                        mainPairList.push(results[k]['returnValues']['pair'])
                    }
                }
                
                if (options['toBlock'] == latestBlock){
                    if (fs.existsSync('data') == 0){
                        fs.mkdirSync('data')
                    }
                    let newArr = JSON.stringify(mainPairList)
                    fs.writeFileSync('./data/main_token_pair_200_uni.json', newArr, 'utf8', (err) =>{
                        console.log('写入成功', err)
                    })
                    process.exit(1)
                }   
            })
            .catch(error => {
                console.log(error)
                let newArr = JSON.stringify(mainPairList)
                fs.writeFileSync('./data/main_token_pair_200_uni.json', newArr, 'utf8', (err) =>{
                    console.log('写入成功', err)
                })
                process.exit(1)
            })
    }
    process.exit(1)
})()