//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public lender;//state variable changing it changes blockchain address datatpye 
    address public inspector;
    address payable public seller; //payable as the escrow contract will have to transfer dunds to it
    address public nftaddr;

    modifier onlySeller() {
        require(msg.sender==seller,'Only seller can call this fn');
        _;
    }
 modifier onlyBuyer(uint256 _nftId) {
        require(msg.sender==buyer[_nftId],'Only buyer can call this fn');
        _;
    }
modifier onlyInspector() {
        require(msg.sender==inspector,'Only inspector can call this fn');
        _;
}
    mapping (uint256 => bool) public isListed;//tokenid->if the property listed?
    mapping (uint256 => uint256) public pp;//purchase price
    mapping (uint256 => uint256) public ea;//escrow amount
    mapping (uint256 => address) public buyer;
    mapping (uint256 => bool) public inspectionStatus;//by default mapping defaults to 0
    mapping(uint256 => mapping(address => bool)) public approval;//mapping to mapping nftid=>{who has approved it}

    //constructor run only once when depploying the contract
    constructor(address _lender,address _inspector,address payable _seller,address _nftaddr)
    {
        lender=_lender;
        inspector=_inspector;
        seller=_seller;
        nftaddr=_nftaddr;
    }
    function list(uint256 _nftId,address _buyer,uint256 _pp,uint256 _ea) public payable onlySeller{
        //transfer the nft from seller to escrow
        //(done using interface) 
        IERC721(nftaddr).transferFrom(msg.sender,address(this),_nftId);
        isListed[_nftId]=true;
        pp[_nftId]=_pp;
        ea[_nftId]=_ea;
        buyer[_nftId]=_buyer;
    }
    function depositEarnest(uint256 _nftId) public payable onlyBuyer(_nftId)
    {//msg.value the amount of ether sent when calling the fn
        require(msg.value>=ea[_nftId]);

        
    }
    receive() external payable {} //allows contract to reviece fund
    function apporveSale(uint256 _nftId)public{
        approval[_nftId][msg.sender]=true;
    }
    function getBalance() public view returns (uint256){//return balance(funds) this contract holds
        return address(this).balance;
    }
    function inspect(uint256 _nftId,bool status) public onlyInspector
    {
        inspectionStatus[_nftId]=status;
    }
    //SALE ->lender sends remainig funds and property token is transfered
    function finalizeSale(uint256 _nftId) public {
        require(inspectionStatus[_nftId]);
        require(approval[_nftId][buyer[_nftId]]);
        require(approval[_nftId][seller]);
        require(approval[_nftId][lender]);
        require(address(this).balance >= pp[_nftId]);

        //now can start the transger of nft
        isListed[_nftId] = false;

        (bool success, ) = payable(seller).call{value: address(this).balance}(
            ""
        );
        require(success);//when funds transfered to seller
            //transfer the nft from escrow to buyer
            //no approval needed as contract already owns it
        IERC721(nftaddr).transferFrom(address(this), buyer[_nftId], _nftId);
    }
    
    // Cancel Sale (handle earnest deposit)
    // -> if inspection status is not approved, then refund, otherwise send to seller
    function cancelSale(uint256 _nftID) public {
        if (inspectionStatus[_nftID] == false) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
    }
}
