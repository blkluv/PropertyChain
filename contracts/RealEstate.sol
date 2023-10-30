//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
//importing zepelin library as NFT is a solved problem
contract RealEstate is ERC721URIStorage {//inherit the class
     using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // to make class(contract) Innumerable i.e there are many contracts each serving differemt purpose
    // 1 contract for 1 propperty

    // to set the standard and name
    constructor() ERC721("Real Estate", "REAL") {}
    // strings array of bytes
    // memeory -> exists only during function call
    // storage -> exists even after fn call
    // for special type(array,structs,mapping) need to mention memory or storage
    function mint(string memory tokenURI) public returns (uint256)//takes URI(uniform resource identifier) url to JSON meta data and returns a tokenid for it  of an nft
    {
        _tokenIds.increment();
        uint256 newId=_tokenIds.current();
        _mint(msg.sender,newId); //_mint(to,tokendid) to is the owner who this nft will bbe minted too
        _setTokenURI(newId,tokenURI); // to add meta data using URI to the nft
        return newId;
    }
    function totalSupply() public view returns(uint256)
    {
        return _tokenIds.current();
    }
}
