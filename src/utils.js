var ethers = require('ethers');
var BN = ethers.BigNumber;

module.exports = {
    
    dataWash(result, pairList){
        let resultList = []
        for (let i = 0; i < result[0].length; i ++){
            resultList.push({'token0': result[0][i], 'token1':result[1][i], 'reserve0': result[2][i], 
                            'reserve1': result[3][i], 'decimals0': result[4][i], 'decimals1': result[5][i],
                            'pair': pairList[i], "type": 0})
        }
        return resultList
    },

    dataWash1(result, pairList){
        let resultList = {}
        for (let i = 0; i < result[0].length; i ++){
            resultList[pairList[i]] = {'token0': result[0][i], 'token1':result[1][i], 'reserve0': result[2][i], 
                            'reserve1': result[3][i], 'decimals0': result[4][i], 'decimals1': result[5][i],
                            'pair': pairList[i], "type": 0}
        }
        return resultList
    },

    dataWash2(result){
        let resultList = {}
        for (let i = 0; i < result[0].length; i ++){
            resultList[result[0][i]] = {'token0': result[1][i], 'token1':result[2][i], 'reserve0': BN.from("1000000000000000000"), 
            'reserve1': BN.from("1000000000000000000"), 'decimals0': result[4][i], 'decimals1': result[5][i],
            'pair': result[0][i], 'fee': result[3][i], type: 1}
        }
        return resultList
    },

    dataWash3(result){
        let resultList = []
        for (let i = 0; i < result[0].length; i ++){
            resultList.push({'token0': result[1][i], 'token1':result[2][i], 'reserve0': BN.from("1000000000000000000"), 
            'reserve1': BN.from("1000000000000000000"), 'decimals0': result[4][i], 'decimals1': result[5][i],
            'pair': result[0][i], 'fee': result[3][i], type: 1})
        }
        return resultList
    },

    dataWash4(result, pairList){
        let resultList = []
        for (let i = 0; i < result[0].length; i ++){
            resultList.push({'token0': result[0][i], 'token1':result[1][i], 'reserve0': result[2][i], 
                            'reserve1': result[3][i], 'decimals0': '0', 'decimals1': '0',
                            'pair': pairList[i], "type": 0, "tokenCounts": 2})
        }
        return resultList
    },

    dataWash5(result, pairList){
        let resultList = {}
        for (let i = 0; i < result[0].length; i ++){
            resultList[pairList[i]] = {'token0': result[0][i], 'token1':result[1][i], 'reserve0': result[2][i], 
                            'reserve1': result[3][i], 'decimals0': '0', 'decimals1': '0',
                            'pair': pairList[i], "type": 0, "tokenCounts": 2}
        }
        return resultList
    },

}