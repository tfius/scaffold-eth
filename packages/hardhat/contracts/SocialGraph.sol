// SPDX-License-Identifier: AGPL-3.0-or-later
// written by @tfius 
pragma solidity ^0.8.0;
// This contract tracks the social graph of users, users can create posts and interact with other users posts
// 

contract SocialGraph {
    struct User {
        address userAddress;
        uint    timestamp;
        uint    engagementScore;
        uint    dayIndex;	
        uint[]  leaderboard; // contains indices of posts in posts array
    }
    struct Interaction {
        address from; // user id
        uint post; // post id
        InteractionType interactionType;
    }
    enum InteractionType { Follow, Like, Comment, Share, Bookmark }
    struct Metadata {
    //    bytes32[] tags; // sha256 hash of the tag
    //    bytes32[] mentions; // sha256 hash of the mentions (address)
        bytes32 category; // sha256 hash of the category
    }
    struct ContentAnalysis {
        uint sentimentScore;
        bytes32 mainTopic; // sha256 hash of the main topic
    }     
    struct Post {
        address creator;
        bytes32 contentPosition; // Position of the content in Swarm
        uint    timestamp;

        uint    likeCount;
        uint    commentCount;
        uint    shareCount;
        uint    totalEngagement;

        Metadata metadata;
        ContentAnalysis contentAnalysis;
    }

    mapping(address => User) public users;
    mapping(uint => Post) public posts;
    uint public postCount;
    Interaction[] public interactions;
    //uint public interactionsCount;
    mapping(address => uint[]) public userPosts; // user posts 
    mapping(address => uint[]) public userInteractions; // user interactions
    mapping(address => uint[]) public userBookmarks; // user bookmarks - posts
    mapping(uint => uint[]) public postInteractions; // post interactions (likes, comments, shares)
    mapping(uint => uint[]) public postComments; // post comments (posts)
    mapping(address => mapping(address => uint)) public engagementScoreBetweenUsers; // mapping of engagement score between followers    
    mapping(address => address[]) public followers; // mapping of who is following who
    mapping(address => mapping(address => uint)) public isFollower;
    mapping(address => address[]) public following;
    mapping(address => mapping(address => uint)) public isFollowing;
    mapping(address => address[]) public engagedWith;

    // metadata mappings     
    mapping(bytes32 => uint[]) public postsWithTopic; // mapping of posts with content analysis
    mapping(bytes32 => uint[]) public postsWithTag; // mapping of posts with tags
    mapping(bytes32 => uint[]) public postsWithCategory; // mapping of posts with category
    mapping(bytes32 => uint[]) public postsWithMention; // mapping of posts with mentions
    mapping(uint => uint[]) public postsByDay; // Map each day to an array of posts
    mapping(uint => address[]) public usersByDay; // map most active users per day

    // leaderboard per user with most engaging posts
    mapping(address => mapping(uint => uint)) public postIndexInLeaderboard; // Maps post ID to its index in the leaderboard array
    uint constant MAX_LEADERBOARD_LENGTH = 20;
    // mapping(address => uint[]) public leaderboards; // Maps user ID to an array of post IDs
    // mapping to prevent double counting of likes and shares
    mapping(address => mapping(uint => uint)) public isPostLiked;
    mapping(address => mapping(uint => uint)) public isPostShared;

    function getRelations(address user, address other) public view returns (uint engagement_to_other, uint engagement_to_user, uint user_following_other, uint user_follower_other, uint other_following_user, uint other_follower_user) {
        return (engagementScoreBetweenUsers[user][other], engagementScoreBetweenUsers[other][user], isFollowing[user][other], isFollower[user][other], isFollowing[other][user], isFollower[other][user]);
    }
    function getUserStats(address user) public view returns (uint following_count, uint followers_count, uint engagedWith_count, uint posts_count, uint interactions_count, uint leaderboard_count,
                                                             User memory userdata) {
        require(users[user].userAddress != address(0), "No user");
        return (following[user].length, followers[user].length, engagedWith[user].length, userPosts[user].length, userInteractions[user].length, users[user].leaderboard.length, 
                users[user]);
    }
    function getPostStats(uint postId) public view returns (uint likeCount, uint commentCount, uint shareCount, uint totalEngagement, uint interactions_count, uint comments_count) {
        require(postId < postCount, "No post");
        return (posts[postId].likeCount, posts[postId].commentCount, posts[postId].shareCount, posts[postId].totalEngagement, postInteractions[postId].length, postComments[postId].length);
    }
    function getInfoOn(bytes32 any) public view returns (uint tags, uint mentions, uint topics, uint categories) {
        return (postsWithTag[any].length, postsWithMention[any].length, postsWithTopic[any].length, postsWithCategory[any].length);
    }
    function getDayStats(uint dayIndex) public view returns(uint, uint) {
        return (postsByDay[dayIndex].length, usersByDay[dayIndex].length);
    }
    // internal function to rebuild users leaderboard
    function engageWithPost(address postCreator, uint postId) private {
        uint[] storage leaderboard = users[postCreator].leaderboard;
        uint index = postIndexInLeaderboard[postCreator][postId];

        if (index == 0 && (leaderboard.length == 0 || leaderboard[index] != postId)) {
            // Post not found in leaderboard, add it
            leaderboard.push(postId);
            index = leaderboard.length - 1;
            postIndexInLeaderboard[postCreator][postId] = index;
        } 
        // else {
        //     // Post found, increase engagement
        //     leaderboard[index].engagement += 1;
        // }

        // Bubble up the post in the leaderboard
        while (index > 0 && shouldSwap(leaderboard, index, index - 1)) {
            // Swap with previous post
            uint postIndex = leaderboard[index];
            leaderboard[index] = leaderboard[index - 1];
            leaderboard[index - 1] = postIndex;

            // Update the indices in the mapping
            postIndexInLeaderboard[postCreator][leaderboard[index]] = index;
            postIndexInLeaderboard[postCreator][leaderboard[index - 1]] = index - 1;

            index -= 1;
        }

        // Check if leaderboard length exceeds maximum and remove last post if necessary
        if (leaderboard.length > MAX_LEADERBOARD_LENGTH) {
            uint postIdToRemove = leaderboard[MAX_LEADERBOARD_LENGTH];
            delete postIndexInLeaderboard[postCreator][postIdToRemove];
            leaderboard.pop();
        }
    }
    function shouldSwap(uint[] memory leaderboard, uint indexA, uint indexB) private view returns (bool) {
        Post memory postA = posts[leaderboard[indexA]];
        Post memory postB = posts[leaderboard[indexB]];

        if (postA.totalEngagement > postB.totalEngagement) {
            return true;
        } else if (postA.totalEngagement == postB.totalEngagement) {
            return postA.timestamp > postB.timestamp;
        } else {
            return false;
        }
    }
    // internal function to interact with post
    function interactWith(uint postId, InteractionType interactionType, address engagingUserAddress) private returns (uint) {
        User storage engagingUser = users[engagingUserAddress];
        User storage engagedUser = users[posts[postId].creator];
        
        Post storage post = posts[postId];
        Interaction memory interaction = Interaction({
            from: msg.sender,
            post: postId,
            interactionType: interactionType
        });
        interactions.push(interaction);
        postInteractions[postId].push(interactions.length - 1);
        userInteractions[msg.sender].push(interactions.length - 1);
        if(engagementScoreBetweenUsers[msg.sender][post.creator] == 0) {
           engagedWith[msg.sender].push(post.creator); // add if not engaged before
        }

        // Update engagement metrics
        if (interactionType == InteractionType.Like) {
            post.likeCount++;
            post.totalEngagement += 1; // Assigning a weight of 1 for likes
            engagementScoreBetweenUsers[msg.sender][post.creator] += 1;
            engagingUser.engagementScore += 1; // Assigning a weight of 1 for interactions
            engagedUser.engagementScore += 2; // Assigning a weight of 2 for interactions
        } else if (interactionType == InteractionType.Comment) {
            post.commentCount++;
            post.totalEngagement += 2; // Assigning a weight of 2 for comments
            engagementScoreBetweenUsers[msg.sender][post.creator] += 5;
            engagingUser.engagementScore += 5; // Assigning a weight of 4 for interactions
            engagedUser.engagementScore += 4; // Assigning a weight of 3 for interactions
        } else if (interactionType == InteractionType.Share) {
            post.shareCount++;
            post.totalEngagement += 3; // Assigning a weight of 3 for shares
            engagementScoreBetweenUsers[msg.sender][post.creator] += 3;
            engagingUser.engagementScore += 3; // Assigning a weight of 3 for interactions
            engagedUser.engagementScore += 4; // Assigning a weight of 4 for interactions
            userPosts[engagingUserAddress].push(postId);
        } else if (interactionType == InteractionType.Bookmark) {
            post.totalEngagement += 3; // Assigning a weight of 3 for shares
            engagementScoreBetweenUsers[msg.sender][post.creator] += 3;
            engagingUser.engagementScore += 3; // Assigning a weight of 3 for interactions
            engagedUser.engagementScore += 4; // Assigning a weight of 4 for interactions
        }
        uint dayIndex = getTodayIndex();
         
        usersByDay[dayIndex].push(engagingUserAddress);
        engagingUser.timestamp = block.timestamp;

        engageWithPost(post.creator, postId);
        return interactions.length - 1;
    }
    function unfollow(address who_following) private {
        require(isFollowing[msg.sender][who_following] > 0, "You are not following this user");
        uint index = isFollowing[msg.sender][who_following] - 1;
        address[] storage followingArray = following[msg.sender];
        // Move the last element into the place to delete
        followingArray[index] = followingArray[followingArray.length - 1];
        followingArray.pop(); // Remove the last element
        // Update isFollowing for the moved follower
        isFollowing[msg.sender][followingArray[index]] = index + 1;
        // Remove the unfollowed user from isFollowing
        delete isFollowing[msg.sender][who_following];
    }
    function follow(address user, bool isFollow) public {
        require(users[user].userAddress != address(0), "No User");
        require(users[msg.sender].userAddress != address(0), "You have no user");
        if(isFollow) {
            users[msg.sender].engagementScore += 4; // assigning a weight of 4 for following
            if(isFollowing[msg.sender][user]==0) {
               following[msg.sender].push(user);
               isFollowing[msg.sender][user] = following[msg.sender].length;
            }
            if(isFollower[user][msg.sender]==0) {
               followers[user].push(msg.sender);
               isFollower[user][msg.sender] = followers[user].length;
            }
            engagementScoreBetweenUsers[msg.sender][user] += 100;
        } else {
            engagementScoreBetweenUsers[msg.sender][user] = 1; // nullify engagement between users
            if(isFollowing[msg.sender][user] > 0) {
                unfollow(user);
            }
        }
    }
    function like(uint postId) public {
        require(postId < postCount, "No post");
        require(users[msg.sender].userAddress != address(0), "No user");
        require(isPostLiked[msg.sender][postId] == 0, "liked");
        
        interactWith(postId, InteractionType.Like, msg.sender);
        isPostLiked[msg.sender][postId] = 1;
    }
    function share(uint postId) public {
        require(postId < postCount, "No post");
        require(users[msg.sender].userAddress != address(0), "No user");
        require(isPostShared[msg.sender][postId] == 0, "shared");

        interactWith(postId, InteractionType.Share, msg.sender);
        isPostShared[msg.sender][postId] = 1;
    }    
    function createPost(bytes32 content, bytes32[] memory tags, bytes32[] memory mentions, bytes32 category) public returns (uint){
        uint dayIndex = getTodayIndex();
        if(users[msg.sender].userAddress == address(0)) {
            users[msg.sender] = User({
                userAddress: msg.sender,
                timestamp: block.timestamp,
                engagementScore: 2,
                dayIndex: 0,
                leaderboard: new uint[](0)
            });
        }
        Post memory post = Post({
            creator: msg.sender,
            timestamp: block.timestamp,
            contentPosition: content,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            totalEngagement: 0,
            metadata: Metadata(category),
            //metadata: Metadata(tags, mentions, category),
            contentAnalysis: ContentAnalysis(0, 0x0)
        });


        userPosts[msg.sender].push(postCount);
        posts[postCount] = post;
        if(users[msg.sender].dayIndex<dayIndex) // add user to usersByDay
        {
           usersByDay[dayIndex].push(msg.sender);
           users[msg.sender].dayIndex=dayIndex;
        }

        for(uint i = 0; i < tags.length; i++) {
            postsWithTag[tags[i]].push(postCount);
        }
        for(uint i = 0; i < mentions.length; i++) {
            postsWithMention[mentions[i]].push(postCount);
        }

        postsByDay[dayIndex].push(postCount);
        postCount++;
        return postCount - 1;
    }    
    function comment(uint postId, bytes32 content, bytes32[] memory tags, bytes32[] memory mentions, bytes32 category) public returns (uint){
        require(postId < postCount, "No Post");
        uint newPostId = createPost(content, tags, mentions, category); 

        Post storage post = posts[postId];
        post.commentCount++;
        post.totalEngagement += 2; // Assigning a weight of 2 for comments
        postComments[postId].push(postCount);

        //User storage engagingUser = users[msg.sender];
        //engagingUser.engagementScore += 5; // assigning a weight of 5 for commenting
        interactWith(postId, InteractionType.Comment, msg.sender);
        
        return newPostId;
    }
    function bookmark(uint postId) public returns (uint){
        require(postId < postCount, "No post");
        require(users[msg.sender].userAddress != address(0), "No user");
        
        userBookmarks[msg.sender].push(postId);
        interactWith(postId, InteractionType.Bookmark, msg.sender);
        return userBookmarks[msg.sender].length - 1;
    }
    function updateContentAnalysis(uint postId, uint sentimentScore, bytes32 mainTopic) public {
        require(postId < postCount, "No post");
        require(msg.sender == posts[postId].creator, "Not creator");
        Post storage post = posts[postId];
        post.contentAnalysis = ContentAnalysis(sentimentScore, mainTopic);
    }
    function getInteractions(uint[] memory interactionIds) public view returns (Interaction[] memory){
            Interaction[] memory result = new Interaction[](interactionIds.length);
            for(uint i = 0; i < interactionIds.length; i++) {
                result[i] = interactions[interactionIds[i]];
            }
            return result;
    }
    function getInteractionsFromPost(uint postId, uint start, uint length) public view returns (uint[] memory){
            require(postId < postCount, "No post");
            require(start < postInteractions[postId].length, "Start out");
            //require(start + length < postInteractions[postId].length, "End out");
            if(start + length > postInteractions[postId].length) {
                length = postInteractions[postId].length - start;
            }
            uint[] memory result = new uint[](length);
            for(uint i = 0; i < length; i++) {
                result[i] = postInteractions[postId][start + i];
            }
            return result;
    }
    function getUserInteractions(address user, uint start, uint length) public view returns(uint[] memory){
        require(users[user].userAddress != address(0), "No user");
        require(start < userInteractions[user].length, "Start out");
        //require(start + length < userInteractions[user].length, "End out");
        if(start + length > userInteractions[user].length) {
           length = userInteractions[user].length - start;
        }
        uint[] memory result = new uint[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = userInteractions[user][start + i];
        }
        return result;
    }
    function getPostsWith(uint[] memory postIds) public view returns (Post[] memory) {
            Post[] memory result = new Post[](postIds.length);
            for(uint i = 0; i < postIds.length; i++) {
                result[i] = posts[postIds[i]];
            }
            return result;
    }    
    function getPosts(uint start, uint length) public view returns (Post[] memory){
        require(start < postCount, "Start out");
        //require(start + length < postCount, "End out");
        if(start + length > postCount) {
           length = postCount - start;
        }
        Post[] memory result = new Post[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = posts[start + i];
        }
        return result;
    }
    function getPostsFromUser(address user, uint start, uint length) public view returns (uint[] memory){
        require(users[user].userAddress != address(0), "No user");
        require(start < userPosts[user].length, "Start out");
        //require(start + length < userPosts[user].length, "End index out of bounds");
        if(start + length > userPosts[user].length) {
           length = userPosts[user].length - start;
        }
        uint[] memory result = new uint[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = userPosts[user][start + i]; //result[i] = posts[userPosts[user][start + i]];
        }
        return result;
    }
    // get last post from addresses (users)
    function getLastPostFromAddresses(address[] memory arr) public view returns (uint[] memory){ 
        uint[] memory result = new uint[](arr.length);
        for(uint i = 0; i < arr.length; i++) {
            if(users[arr[i]].userAddress != address(0))
               if(userPosts[arr[i]].length > 0)
                  result[i] = userPosts[arr[i]][userPosts[arr[i]].length - 1];
                  //result[i] = posts[userPosts[arr[i]][userPosts[arr[i]].length - 1]];
        }
        return result;
    }
    function getPostComments(uint postId, uint start, uint length) public view returns (uint[] memory){
        require(postId < postCount, "No post");
        require(start < postComments[postId].length, "Start out");
        //require(start + length < postComments[postId].length, "End index out of bounds");
        if(start + length > postComments[postId].length) {
           length = postComments[postId].length - start;
        }
        uint[] memory result = new uint[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = postComments[postId][start + i]; //result[i] = posts[postComments[postId][start + i]];
        }
        return result;
    }
    function getUsersFromAddresses(address[] memory arr) public view returns (User[] memory) {
        User[] memory result = new User[](arr.length);
        for(uint i = 0; i < arr.length; i++) {
            if(users[arr[i]].userAddress != address(0))
               result[i] = users[arr[i]];
        }
        return result;
    }
    function getUsers(address[] memory array, uint start, uint length) public view returns (User[] memory) {
        uint flength = array.length; 
        require(start < flength, "Start index out of bounds");
        require(start + length <= flength, "Requested range exceeds follower count");

        User[] memory result = new User[](length);
        for (uint i = 0; i < length; i++) {
            result[i] = users[array[start + i]];
        }
        return result;
    }
    function getFollowers(address user, uint start, uint length) public view returns (User[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        return getUsers(followers[user], start, length);
    }
    function getFollowing(address user, uint start, uint length) public view returns (User[] memory) {
        require(users[user].userAddress != address(0), "No User");
        return getUsers(following[user], start, length);
    }
    function getEngagedWith(address user, uint start, uint length) public view returns (User[] memory) {
        require(users[user].userAddress != address(0), "No User");
        return getUsers(engagedWith[user], start, length);
    }
    function getLeaderboard(address user) public view returns(uint[] memory) {
        require(users[user].userAddress != address(0), "No user");
        return users[user].leaderboard; // returns post ids
    }
    // get engagements scores for others from user
    function getEngagementScores(address user, address[] memory others) public view returns (User[] memory, uint[] memory, uint[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        // go through all followed and get engagementScoreBetweenUsers
        User[] memory targets = new User[](others.length); 
        uint[] memory scores_to_targets = new uint[](others.length);
        uint[] memory scores_from_targets = new uint[](others.length);

        for(uint i = 0; i < others.length; i++) {
            targets[i] = users[others[i]];
            scores_to_targets[i] = engagementScoreBetweenUsers[user][targets[i].userAddress];
            scores_from_targets[i] = engagementScoreBetweenUsers[targets[i].userAddress][user];
        }

        return (targets, scores_to_targets, scores_from_targets);
    }
    function getStohastic(address[] memory addresses, uint sampleSize) private view returns (address[] memory) {
        if (sampleSize > addresses.length) {
            sampleSize = addresses.length;
        }

        address[] memory sampled = new address[](sampleSize);
        // for (uint i = 0; i < sampleSize; i++) {
        //     uint randomIndex = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % addresses.length;
        //     sampled[i] = addresses[randomIndex];
        // }
        bytes32 randomHash = keccak256(abi.encodePacked(block.timestamp, msg.sender));
        uint randomValue = uint(randomHash);

        for (uint i = 0; i < sampleSize; i++) {
            uint randomIndex = randomValue % addresses.length;
            sampled[i] = addresses[randomIndex]; // Update randomValue for next iteration
            randomValue = randomValue >> 16; // Bitwise right shift
        }

        return sampled;
    }
    function getStohasticUsers(address user, uint topN, uint user_type) public view returns(address[] memory) {
        require(users[user].userAddress != address(0), "No user");
        if(user_type == 0) {
           return getStohastic(followers[user], topN);
        } else if(user_type == 1) {
           return getStohastic(following[user], topN);
        } else {
           return getStohastic(engagedWith[user], topN);
        }
    }
    function getRecentPostsFrom(address[] memory fromUsers, uint count) public view returns (uint[] memory) {
        uint[] memory recentPosts = new uint[](count);
        uint index = 0;

        for (uint i = 0; i < fromUsers.length; i++) {
            //address user = fromUsers[i];
            uint[] storage postsFromFollower = userPosts[fromUsers[i]];
            
            for (uint j = postsFromFollower.length > count ? postsFromFollower.length - count : 0; j < postsFromFollower.length; j++) {
                if (index < count) {
                    recentPosts[index] = postsFromFollower[j];
                    index++;
                }
            }
        }
        return recentPosts;
    }
    function getPostsFromLeaderboard(address user, uint count) public view returns (uint[] memory) {
        require(users[user].userAddress != address(0), "No user");
        uint[] memory leaderboardPosts = new uint[](users[user].leaderboard.length);
        uint index = 0;

        for (uint i = 0; i < users[user].leaderboard.length; i++) {
            if (index < count) {
                leaderboardPosts[index] = users[user].leaderboard[i];
                index++;
            }
        }
        return leaderboardPosts;
    }
    function getPostIdsWithCategory(bytes32 category, uint start, uint length) public view returns(uint[] memory) {
        require(start < postsWithCategory[category].length, "Start index out of bounds");
        //require(start + length <= postsWithCategory[category].length, "Requested range exceeds post count");
        if(start + length > postsWithCategory[category].length) {
           length = postsWithCategory[category].length - start;
        }

        uint[] memory result = new uint[](length);
        for (uint i = 0; i < length; i++) {
            result[i] = postsWithCategory[category][start + i];
        }
        return result;
    }
    function getPostIdsWithTags(bytes32 tag, uint start, uint length) public view returns(uint[] memory) {
        require(start < postsWithTag[tag].length, "Start index out of bounds");
        //require(start + length <= postsWithTag[tag].length, "Requested range exceeds post count");
        if(start + length > postsWithTag[tag].length) {
           length = postsWithTag[tag].length - start;
        }

        uint[] memory result = new uint[](length);
        for (uint i = 0; i < length; i++) {
            result[i] = postsWithTag[tag][start + i];
        }
        return result;
    }
    function getPostIdsWithTopic(bytes32 topic, uint start, uint length) public view returns(uint[] memory) {
        require(start < postsWithTopic[topic].length, "Start index out of bounds");
        //require(start + length <= postsWithTopic[topic].length, "Requested range exceeds post count");
        if(start + length > postsWithTopic[topic].length) {
           length = postsWithTopic[topic].length - start;
        }

        uint[] memory result = new uint[](length);
        for (uint i = 0; i < length; i++) {
            result[i] = postsWithTopic[topic][start + i];
        }
        return result;
    }
    function getPostIdsWithMentions(bytes32 mention, uint start, uint length) public view returns(uint[] memory) {
        require(start < postsWithMention[mention].length, "Start index out of bounds");
        //require(start + length <= postsWithMention[mention].length, "Requested range exceeds post count");
        if(start + length > postsWithMention[mention].length) {
           length = postsWithMention[mention].length - start;
        }

        uint[] memory result = new uint[](length);
        for (uint i = 0; i < length; i++) {
            result[i] = postsWithMention[mention][start + i];
        }
        return result;
    }
    function getTodayIndex() public view returns(uint) {
        return block.timestamp / (24 * 60 * 60);
    }

    function getPostsPerDay(uint dayIndex, uint start, uint length) public view returns(uint[] memory) {
        if(start + length > postsByDay[dayIndex].length) {
           length = postsByDay[dayIndex].length - start;
        }

        uint[] memory latestPosts = new uint[](length);
        uint currentIndex = 0;
        for (uint i = 0; i < length; i++) {
            latestPosts[currentIndex] = postsByDay[dayIndex][start+i];
            currentIndex++;
        }

        return latestPosts;
    }
    function getUsersPerDay(uint dayIndex, uint start, uint length) public view returns(address[] memory) {
        if(start + length > usersByDay[dayIndex].length) {
           length = usersByDay[dayIndex].length - start;
        }

        address[] memory latestUsers = new address[](length);
        uint currentIndex = 0;
        for (uint i = 0; i < length; i++) {
            latestUsers[currentIndex] = usersByDay[dayIndex][start+i];
            currentIndex++;
        }

        return latestUsers;
    }

    /*
    function generateFeed(address user, uint count, uint user_type) public view returns (Post[] memory) {
        require(users[user].userAddress != address(0), "No user");
        
        uint[] memory recentPosts = getRecentPostsFrom(followers[user], count);
        
        // Sort the posts based on engagement and recency
        for (uint i = 0; i < recentPosts.length; i++) {
            for (uint j = i + 1; j < recentPosts.length; j++) {
                if (posts[recentPosts[i]].totalEngagement < posts[recentPosts[j]].totalEngagement) {
                    uint temp = recentPosts[i];
                    recentPosts[i] = recentPosts[j];
                    recentPosts[j] = temp;
                }
            }
        }

        // Fetch the posts
        Post[] memory feed = new Post[](count);
        for (uint i = 0; i < count && i < recentPosts.length; i++) {
            feed[i] = posts[recentPosts[i]];
        }

        return feed;
    }*/
}