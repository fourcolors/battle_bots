// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title BattleBot
 * @dev Simple NFT implementation for battle bots with metadata storage
 * Metadata is stored on IPFS and should follow the format:
 * {
 *   "version": 1,
 *   "name": "Battle Bot #1",
 *   "battlePrompt": "A strategic combat AI that specializes in calculated strikes",
 *   "image": "ipfs://...",
 *   "attributes": {
 *     "attack": 75,
 *     "defense": 60,
 *     "speed": 85,
 *     "mainWeapon": 1
 *   }
 * }
 */
contract BattleBot is ERC721URIStorage {
    // Counter for token IDs
    uint256 private _nextTokenId;

    // Events
    event BattleBotMinted(address indexed owner, uint256 indexed tokenId, string tokenURI);

    /**
     * @dev Constructor initializes the contract with a name and symbol
     */
    constructor() ERC721("BattleBot", "BBOT") {}

    /**
     * @dev Mint a new Battle Bot NFT
     * @param uri IPFS URI containing the bot's metadata
     * @return tokenId The ID of the newly minted token
     */
    function mintBot(string memory uri) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit BattleBotMinted(msg.sender, tokenId, uri);

        return tokenId;
    }

    /**
     * @dev Returns the total number of tokens minted
     */
    function getTotalSupply() public view returns (uint256) {
        return _nextTokenId;
    }

    // The following functions are overrides required by Solidity.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 