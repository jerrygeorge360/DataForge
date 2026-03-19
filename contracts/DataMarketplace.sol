// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DataMarketplace
 * @notice Buy and sell Filecoin-backed datasets with trustless escrow
 * @dev Deployed on Filecoin Calibration Testnet (chainId 314159)
 */
contract DataMarketplace {
    enum ListingType {
        SINGLE,
        CONTINUOUS
    }

    struct Listing {
        address payable seller;
        string cid; // Filecoin PieceCID or JSON CID for encrypted data
        string previewCid;
        string name;
        string description;
        string category;
        string fileFormat;
        uint256 rowCount;
        uint256 fileSizeBytes;
        uint256 price;
        bool sold;
        bool active;
        ListingType listingType;
    }

    address public owner;
    uint256 public platformFeeBps = 250; // 2.5%

    uint256 public listingCount;
    mapping(uint256 => Listing) public listings;
    // listingId => buyer address (only for SINGLE type)
    mapping(uint256 => address) public purchasedBy;
    // listingId => buyer address => bool (for CONTINUOUS type)
    mapping(uint256 => mapping(address => bool)) public hasPurchased;

    // --- Bounties (The "Wanted" Board) ---
    struct Bounty {
        address payable buyer;
        uint256 reward;
        string description;
        bool fulfilled;
        address fulfiller;
        bool active;
    }

    uint256 public bountyCount;
    mapping(uint256 => Bounty) public bounties;

    // --- Reputation (Proof of Quality) ---
    mapping(address => uint256) public reputationScore;
    mapping(uint256 => mapping(address => bool)) public hasRatedListing;

    event DatasetListed(
        uint256 indexed listingId,
        address indexed seller,
        string cid,
        string previewCid,
        string name,
        string category,
        string fileFormat,
        uint256 price,
        ListingType listingType
    );

    event DatasetPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price,
        string cid
    );

    event ListingCancelled(uint256 indexed listingId);

    event BountyCreated(
        uint256 indexed bountyId,
        address indexed buyer,
        uint256 reward,
        string description
    );

    event BountyFulfilled(
        uint256 indexed bountyId,
        address indexed fulfiller,
        string cid
    );

    event BountyCancelled(uint256 indexed bountyId);

    event ReputationUpdated(address indexed user, uint256 newScore);

    event PlatformFeeUpdated(uint256 newFeeBps);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function setPlatformFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 1000, "Max fee 10%");
        platformFeeBps = newFeeBps;
        emit PlatformFeeUpdated(newFeeBps);
    }

    function listDataset(
        string calldata cid,
        string calldata previewCid,
        string calldata name,
        string calldata description,
        string calldata category,
        string calldata fileFormat,
        uint256 rowCount,
        uint256 fileSizeBytes,
        uint256 price,
        ListingType listingType
    ) external returns (uint256 listingId) {
        require(bytes(cid).length > 0, "CID required");
        require(price > 0, "Price must be > 0");

        listingId = listingCount++;
        listings[listingId] = Listing({
            seller: payable(msg.sender),
            cid: cid,
            previewCid: previewCid,
            name: name,
            description: description,
            category: category,
            fileFormat: fileFormat,
            rowCount: rowCount,
            fileSizeBytes: fileSizeBytes,
            price: price,
            sold: false,
            active: true,
            listingType: listingType
        });

        emit DatasetListed(
            listingId,
            msg.sender,
            cid,
            previewCid,
            name,
            category,
            fileFormat,
            price,
            listingType
        );
    }

    function purchaseDataset(uint256 listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value == listing.price, "Incorrect payment amount");
        require(msg.sender != listing.seller, "Cannot buy own listing");

        if (listing.listingType == ListingType.SINGLE) {
            require(!listing.sold, "Already sold");
            listing.sold = true;
            listing.active = false;
            purchasedBy[listingId] = msg.sender;
        } else {
            require(!hasPurchased[listingId][msg.sender], "Already purchased");
            hasPurchased[listingId][msg.sender] = true;
        }

        emit DatasetPurchased(
            listingId,
            msg.sender,
            listing.seller,
            msg.value,
            listing.cid
        );

        uint256 fee = (msg.value * platformFeeBps) / 10000;
        uint256 sellerAmount = msg.value - fee;

        (bool successSeller, ) = listing.seller.call{value: sellerAmount}("");
        require(successSeller, "Seller payment failed");

        if (fee > 0) {
            (bool successOwner, ) = owner.call{value: fee}("");
            require(successOwner, "Fee payment failed");
        }
    }

    function isAuthorized(
        uint256 listingId,
        address user
    ) public view returns (bool) {
        Listing storage listing = listings[listingId];
        if (listing.seller == user) return true;

        if (listing.listingType == ListingType.SINGLE) {
            return purchasedBy[listingId] == user;
        } else {
            return hasPurchased[listingId][user];
        }
    }

    function createBounty(
        string calldata description
    ) external payable returns (uint256 bountyId) {
        require(msg.value > 0, "Reward must be > 0");
        bountyId = bountyCount++;
        bounties[bountyId] = Bounty({
            buyer: payable(msg.sender),
            reward: msg.value,
            description: description,
            fulfilled: false,
            fulfiller: address(0),
            active: true
        });
        emit BountyCreated(bountyId, msg.sender, msg.value, description);
    }

    function fulfillBounty(
        uint256 bountyId,
        string calldata cid,
        string calldata previewCid,
        string calldata name,
        string calldata description
    ) external {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.active, "Bounty not active");
        require(!bounty.fulfilled, "Already fulfilled");

        bounty.fulfilled = true;
        bounty.active = false;
        bounty.fulfiller = msg.sender;

        uint256 listingId = listingCount++;
        listings[listingId] = Listing({
            seller: payable(msg.sender),
            cid: cid,
            previewCid: previewCid,
            name: name,
            description: description,
            category: "Bounty Fulfillment",
            fileFormat: "Unknown",
            rowCount: 0,
            fileSizeBytes: 0,
            price: bounty.reward,
            sold: true,
            active: false,
            listingType: ListingType.SINGLE
        });
        purchasedBy[listingId] = bounty.buyer;

        emit BountyFulfilled(bountyId, msg.sender, cid);
        emit DatasetPurchased(
            listingId,
            bounty.buyer,
            msg.sender,
            bounty.reward,
            cid
        );

        uint256 fee = (bounty.reward * platformFeeBps) / 10000;
        uint256 sellerAmount = bounty.reward - fee;

        (bool successSeller, ) = payable(msg.sender).call{value: sellerAmount}(
            ""
        );
        require(successSeller, "Reward transfer failed");

        if (fee > 0) {
            (bool successOwner, ) = owner.call{value: fee}("");
            require(successOwner, "Fee transfer failed");
        }
    }

    function cancelBounty(uint256 bountyId) external {
        Bounty storage bounty = bounties[bountyId];
        require(msg.sender == bounty.buyer, "Not buyer");
        require(
            bounty.active && !bounty.fulfilled,
            "Bounty not active or completed"
        );

        bounty.active = false;
        uint256 reward = bounty.reward;
        bounty.reward = 0;

        (bool success, ) = msg.sender.call{value: reward}("");
        require(success, "Refund failed");

        emit BountyCancelled(bountyId);
    }

    function rateListing(uint256 listingId, bool positive) external {
        Listing storage listing = listings[listingId];
        require(!hasRatedListing[listingId][msg.sender], "Already rated");
        require(isAuthorized(listingId, msg.sender), "Not authorized to rate");
        require(msg.sender != listing.seller, "Sellers cannot rate themselves");

        hasRatedListing[listingId][msg.sender] = true;

        if (positive) {
            reputationScore[listing.seller] += 10;
        } else {
            if (reputationScore[listing.seller] >= 20) {
                reputationScore[listing.seller] -= 20;
            } else {
                reputationScore[listing.seller] = 0;
            }
        }

        emit ReputationUpdated(listing.seller, reputationScore[listing.seller]);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(msg.sender == listing.seller, "Not seller");
        require(!listing.sold, "Already sold");
        listing.active = false;
        emit ListingCancelled(listingId);
    }

    function getCID(uint256 listingId) external view returns (string memory) {
        require(isAuthorized(listingId, msg.sender), "Not authorized");
        return listings[listingId].cid;
    }

    function getActiveListings() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].active) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < listingCount; i++) {
            if (listings[i].active) ids[idx++] = i;
        }
        return ids;
    }

    function getActiveBounties() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < bountyCount; i++) {
            if (bounties[i].active) count++;
        }
        uint256[] memory ids = new uint256[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < bountyCount; i++) {
            if (bounties[i].active) ids[idx++] = i;
        }
        return ids;
    }
}
