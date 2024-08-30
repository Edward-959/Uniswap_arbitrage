//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
pragma experimental ABIEncoderV2;

library SafeMath {

    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }


    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b <= a, "SafeMath: subtraction overflow");
        uint256 c = a - b;

        return c;
    }


    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-solidity/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }


    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, "SafeMath: division by zero");
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }


    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        require(b != 0, "SafeMath: modulo by zero");
        return a % b;
    }
}

interface IERC20 {
    event Approval(address indexed owner, address indexed spender, uint value);
    event Transfer(address indexed from, address indexed to, uint value);

    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);
}



interface IRouter{
    function approvePlugin(address _plugin) external;
    function swap(address[] memory _path, uint256 _amountIn, uint256 _minOut, address _receiver) external;
}

interface IReader{
    function getAmountOut(address _vault, address _tokenIn, address _tokenOut, uint256 _amountIn) 
        external view returns (uint256, uint256);
    function getMaxAmountIn(address _vault, address _tokenIn, address _tokenOut)
        external view returns (uint256);
}

interface IPositionRouter{
    function createIncreasePosition(
        address[] memory _path,
        address _indexToken,
        uint256 _amountIn,
        uint256 _minOut,
        uint256 _sizeDelta,
        bool _isLong,
        uint256 _acceptablePrice,
        uint256 _executionFee,
        bytes32 _referralCode,
        address _callbackTarget
    ) external payable returns (bytes32);

    function createDecreasePosition(
        address[] memory _path,
        address _indexToken,
        uint256 _collateralDelta,
        uint256 _sizeDelta,
        bool _isLong,
        address _receiver,
        uint256 _acceptablePrice,
        uint256 _minOut,
        uint256 _executionFee,
        bool _withdrawETH,
        address _callbackTarget
    ) external payable returns (bytes32);

    function minExecutionFee() external view returns(uint256);
}


interface IVault{
    function getDelta(address _indexToken, uint256 _size, uint256 _averagePrice, bool _isLong, uint256 _lastIncreasedTime) 
        external view returns (bool, uint256);
    function getMinPrice(address _token) external view returns (uint256);
    function getMaxPrice(address _token) external view returns (uint256);
}


contract gmxArbitrage{

    using SafeMath for uint256;

    address internal reader = 0x22199a49A999c351eF7927602CFB187ec3cae489;
    address internal router = 0xaBBc5F99639c9B6bCb58544ddf04EFA6802F4064;
    address internal positionRouter = 0xb87a436B93fFE9D75c5cFA7bAcFff96430b09868;
    address internal vault = 0x489ee077994B6658eAfA855C308275EAd8097C4A;
    address internal weth = 0x82aF49447D8a07e3bd95BD0d56f35241523fBab1;
    address internal wbtc = 0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f;
    address internal uni = 0xFa7F8980b0f1E64A2062791cc3b0871572f1F7f0;
    address internal owner;

    constructor() {
        owner = msg.sender;
        IERC20(weth).approve(router, 1e50);

    }

    receive() external payable{}

    function getAmountOut(address tokenIn, address tokenOut, uint256 amountIn) external view returns(uint256){
        (uint256 amountOut, ) = IReader(reader).getAmountOut(vault, tokenIn, tokenOut, amountIn);
        return amountOut;
    }

    function openLongPosition(address token0, address indexToken, uint256 amountIn) external payable{
        IRouter(router).approvePlugin(positionRouter);
        address[] memory path = new address[](1);
        path[0] = token0;
        uint256 delta = getDelta(token0, amountIn, true);
        uint256 acceptablePrice = IVault(vault).getMinPrice(token0);
        uint256 fee = IPositionRouter(positionRouter).minExecutionFee();
        positionRouter.call{value: 1000000000000000}("");
        IPositionRouter(positionRouter)
        .createIncreasePosition(path, indexToken, amountIn, 0, delta, true, acceptablePrice, fee, "0x", address(0)).call{value: 1000000000000000};
    }

    function getDelta(address tokenIn, uint256 amountIn, bool maxMin) public view returns(uint256){
        uint256 price;
        if(maxMin == true){
            // 输出的价格就是30位USD的价格。
            price = IVault(vault).getMaxPrice(tokenIn);
        }
        else{
            price = IVault(vault).getMinPrice(tokenIn);
        }
        uint256 delta = price.mul(amountIn);
        return delta;
    }

    function getBalance(address token) public view returns (uint256){
        return(IERC20(token).balanceOf(address(this)));
    }

    function withdraw(address token) external {
        if (msg.sender == owner){
            IERC20(token).transfer(msg.sender, getBalance(token));
        }
    }

 }