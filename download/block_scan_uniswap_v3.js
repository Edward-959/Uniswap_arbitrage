var Web3 = require('web3');
var ethers = require('ethers');
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
    // chainstack node wss://ws-nd-336-912-929.p2pify.com/3a3cb3f742be775d03d4d0a440053120
    // alchemy node wss://eth-mainnet.g.alchemy.com/v2/Q0itxBQlh0ghyu57EvbMSfSBQaNMZGTf
    // infura node wss://mainnet.infura.io/ws/v3/20fcbf4e84754d45b45f87928958ba3e
    const web3 = new Web3(new Web3.providers.WebsocketProvider('wss://eth-mainnet.g.alchemy.com/v2/Q0itxBQlh0ghyu57EvbMSfSBQaNMZGTf'))
    // 监听aave合约的新borrow活动
    const uniswapV3Factory = '0x1F98431c8aD98523631AE4a59f267346ea31F984'
    // const sushiswapFactory = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'

    var aaveInstance= new web3.eth.Contract(abis['UNISWAP_V3_FACTORY'], uniswapV3Factory)

    let dataDir = './data/top_100_tokens.json';
    let dataDir1 = './data/top_200_tokens.json';
    let mainTokenList = JSON.parse(fs.readFileSync(dataDir, 'utf8'))
    let mainTokenList1 = JSON.parse(fs.readFileSync(dataDir1, 'utf8'))
    mainTokenList = mainTokenList.concat(mainTokenList1)

    let startBlock = 12369621
    // let latestBlock = 10020835
    // let startBlock = 16500000
    let latestBlock = 16584052
    let step = 1000
    let fromBlock
    let endBlock
    let mainPairList = [[], [], [], []]
    let loopNum = math.round((latestBlock - startBlock) / step + 0.5)

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

        await aaveInstance.getPastEvents('PoolCreated', options)
            .then(results => {
                
                for (k = 0; k < results.length; k++){
                    token0 = results[k]['returnValues']['token0']
                    token1 = results[k]['returnValues']['token1']
                    if (inArray(token0, mainTokenList) == true || inArray(token1, mainTokenList == true)){
                        mainPairList[0].push(results[k]['returnValues']['pool'])
                        mainPairList[1].push(results[k]['returnValues']['token0'])
                        mainPairList[2].push(results[k]['returnValues']['token1'])
                        mainPairList[3].push(results[k]['returnValues']['fee'])
                    }
                }
                
                if (options['toBlock'] == latestBlock){
                    if (fs.existsSync('data') == 0){
                        fs.mkdirSync('data')
                    }
                    let newArr = JSON.stringify(mainPairList)
                    fs.writeFileSync('./data/uniswapV3_pool.json', newArr, 'utf8', (err) =>{
                        console.log('写入成功', err)
                    })
                    process.exit(1)
                }   
            })
            .catch(error => {
                console.log(error)
                let newArr = JSON.stringify(mainPairList)
                fs.writeFileSync('./data/uniswapV3_pair.json', newArr, 'utf8', (err) =>{
                    console.log('写入成功', err)
                })
                process.exit(1)
            })
    }
    process.exit(1)
})()