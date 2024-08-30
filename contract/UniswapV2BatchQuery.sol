//SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;


interface IUniswapV2Pair{
    function token0() external view returns(address);
    function token1() external view returns(address);
    function getReserves() external view returns (uint112 _reserve0, uint112 _reserve1, uint32 _blockTimestampLast);
}


contract AaveBatchQuery{
    function uniswapV2PairsBatchQuery(address[] calldata pairList) external view returns(address[] memory, address[] memory, uint112[] memory, uint112[]memory){
        address[] memory token0List = new address[](pairList.length);
        address[] memory token1List = new address[](pairList.length);
        uint112[] memory reserve0List = new uint112[](pairList.length);
        uint112[] memory reserve1List = new uint112[](pairList.length);
        for (uint i = 0; i < pairList.length; i++){
            token0List[i] = IUniswapV2Pair(pairList[i]).token0();
            token1List[i] = IUniswapV2Pair(pairList[i]).token1();
            (reserve0List[i], reserve1List[i], ) = IUniswapV2Pair(pairList[i]).getReserves();
        }
        return(token0List, token1List, reserve0List, reserve1List);
    }
}