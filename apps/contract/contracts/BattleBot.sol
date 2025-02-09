// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BattleBot
 * @dev Implementation of a battle bot NFT with metadata storage
 */
contract BattleBot is ERC721, ERC721URIStorage, ERC721Burnable, Pausable, Ownable, ReentrancyGuard {
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Events
    event BattleBotMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);
    event BattleBotURIUpdated(uint256 indexed tokenId, string newURI);

    /**
     * @dev Constructor initializes the contract with a name and symbol
     */
    constructor() ERC721("BattleBot", "BBOT") {}

    /**
     * @dev Mint a new Battle Bot NFT
     * @param uri IPFS URI containing the bot's metadata
     * @return tokenId The ID of the newly minted token
     */
    function mintBot(string memory uri) 
        public 
        nonReentrant 
        whenNotPaused 
        returns (uint256) 
    {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit BattleBotMinted(msg.sender, tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Update the token URI for a battle bot
     * @param tokenId The ID of the token to update
     * @param newURI The new URI to set
     */
    function updateTokenURI(uint256 tokenId, string memory newURI) 
        public 
        whenNotPaused 
    {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Caller is not owner nor approved");
        _setTokenURI(tokenId, newURI);
        
        emit BattleBotURIUpdated(tokenId, newURI);
    }

    /**
     * @dev Returns the total number of tokens minted
     */
    function getTotalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    /**
     * @dev Pause token minting and transfers
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @dev Unpause token minting and transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721URIStorage)
        whenNotPaused
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 