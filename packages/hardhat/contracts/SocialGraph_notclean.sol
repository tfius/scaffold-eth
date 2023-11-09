// SPDX-License-Identifier: AGPL-3.0-or-later
// written by @tfius 
pragma solidity ^0.8.0;
// This contract tracks the social graph of users, users can create posts and interact with other users posts
// 

contract SocialGraph1 {
    struct User {
        address userAddress;
        uint    timestamp;
        uint    engagementScore;
        uint[]  leaderboard; // contains indices of posts in posts array
    }
    struct Interaction {
        address from; // user id
        uint post; // post id
        InteractionType interactionType;
    }
    enum InteractionType { Follow, Like, Comment, Share }
    struct Metadata {
        bytes32[] tags; // sha256 hash of the tag
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
    uint public interactionsCount;
    mapping(address => uint[]) public userPosts; // user posts 
    mapping(address => uint[]) public userInteractions; // user interactions
    mapping(uint => uint[]) public postInteractions; // post interactions (likes, comments, shares)
    mapping(uint => uint[]) public postComments; // post comments (likes, comments, shares)
    mapping(address => mapping(address => uint)) public engagementScoreBetweenUsers; // mapping of engagement score between followers    
    mapping(address => address[]) public followers; // mapping of who is following who
    mapping(address => mapping(address => uint)) public isFollower;
    mapping(address => address[]) public following;
    mapping(address => mapping(address => uint)) public isFollowing;
    mapping(address => address[]) public engagedWith;

    // leaderboard per user with most engaging posts
    mapping(address => mapping(uint => uint)) public postIndexInLeaderboard; // Maps post ID to its index in the leaderboard array
    uint constant MAX_LEADERBOARD_LENGTH = 20;
    mapping(address => uint[]) public leaderboards; // Maps user ID to an array of post IDs

    function deleteUserPost(address user, uint postIndex) public {
        require(users[user].userAddress != address(0), "User does not exist");
        require(postIndex < userPosts[user].length, "Post does not exist");
        uint postId = userPosts[user][postIndex];
        require(posts[postId].creator == user, "Post does not belong to user");
        // delete post from userPosts
        // Move the last element into the place to delete
        userPosts[user][postIndex] = userPosts[user][userPosts[user].length - 1];
        userPosts[user].pop(); // Remove the last element
        // Update userPosts for the moved post
        userPosts[user][userPosts[user][postIndex]] = postIndex;
        // delete post from posts
        // // // delete posts[postId];
        // // // // delete post from postInteractions
        // // // for(uint i = 0; i < postInteractions[postId].length; i++) {
        // // //     delete interactions[postInteractions[postId][i]];
        // // // }
        // // // delete postInteractions[postId];
        // // // // delete post from postComments
        // // // for(uint i = 0; i < postComments[postId].length; i++) {
        // // //     delete interactions[postComments[postId][i]];
        // // // }
        // // // delete postComments[postId];
        // // // // delete post from userInteractions
        // // // for(uint i = 0; i < userInteractions[user].length; i++) {
        // // //     delete interactions[userInteractions[user][i]];
        // // // }
        // // // delete userInteractions[user];
        // // // // delete post from engagementScoreBetweenUsers
        // // // for(uint i = 0; i < engagedWith[user].length; i++) {
        // // //     engagementScoreBetweenUsers[user][engagedWith[user][i]] = 0;
        // // // }
        // // // delete engagedWith[user];
        // // // delete userPosts[user][postId];
    }
    function getUserStats(address user) public view returns (uint following_count, uint followers_count, uint engagedWith_count, uint posts_count, uint interactions_count, uint leaderboard_count) {
        require(users[user].userAddress != address(0), "User does not exist");
        return (following[user].length, followers[user].length, engagedWith[user].length, userPosts[user].length, userInteractions[user].length, users[user].leaderboard.length);
    }
    function getPostStats(uint postId) public view returns (uint likeCount, uint commentCount, uint shareCount, uint totalEngagement, uint interactions_count, uint comments_count) {
        require(postId < postCount, "Post does not exist");
        return (posts[postId].likeCount, posts[postId].commentCount, posts[postId].shareCount, posts[postId].totalEngagement, postInteractions[postId].length, postComments[postId].length);
    }
    function createPost(bytes32 content) public returns (uint){
        if(users[msg.sender].userAddress == address(0)) {
            users[msg.sender] = User({
                userAddress: msg.sender,
                timestamp: block.timestamp,
                engagementScore: 1,
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
            metadata: Metadata(new bytes32[](0), 0x0),
            contentAnalysis: ContentAnalysis(0, 0x0)                        
        });
        userPosts[msg.sender].push(postCount);
        posts[postCount] = post;
        postCount++;
        return postCount - 1;
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
        //require(postId < postCount, "Post does not exist");
        //require(users[msg.sender].userAddress != address(0), "User does not exist");
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
            engagedUser.engagementScore += 1; // Assigning a weight of 1 for interactions
        } else if (interactionType == InteractionType.Comment) {
            post.commentCount++;
            post.totalEngagement += 2; // Assigning a weight of 2 for comments
            engagementScoreBetweenUsers[msg.sender][post.creator] += 5;
            engagingUser.engagementScore += 2; // Assigning a weight of 1 for interactions
            engagedUser.engagementScore += 2; // Assigning a weight of 1 for interactions
        } else if (interactionType == InteractionType.Share) {
            post.shareCount++;
            post.totalEngagement += 3; // Assigning a weight of 3 for shares
            engagementScoreBetweenUsers[msg.sender][post.creator] += 3;
            engagingUser.engagementScore += 3; // Assigning a weight of 1 for interactions
            engagedUser.engagementScore += 5; // Assigning a weight of 1 for interactions
            userPosts[engagingUserAddress].push(postId);
        }

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
        require(users[user].userAddress != address(0), "User does not exist");
        require(users[msg.sender].userAddress != address(0), "Your user does not exist");
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
        require(postId < postCount, "Post does not exist");
        require(users[msg.sender].userAddress != address(0), "Your user does not exist");

        interactWith(postId, InteractionType.Like, msg.sender);
    }
    function share(uint postId) public {
        require(postId < postCount, "Post does not exist");
        require(users[msg.sender].userAddress != address(0), "Your user not exist");
        interactWith(postId, InteractionType.Share, msg.sender);
    }    
    function comment(uint postId, bytes32 content) public returns (uint){
        require(postId < postCount, "Post does not exist");
        //require(users[msg.sender].userAddress != address(0), "Your user does not exist");
        if(users[msg.sender].userAddress == address(0)) {
            users[msg.sender] = User({
                userAddress: msg.sender,
                timestamp: block.timestamp,
                engagementScore: 2,
                leaderboard: new uint[](0)
            });
        }
        
        Post storage post = posts[postId];
        Post memory newcomment = Post({
            creator: msg.sender,
            timestamp: block.timestamp,
            contentPosition: content,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0,
            totalEngagement: 1, // giving a weight of 1 for the comment
            //comments: new uint[](0),
            metadata: post.metadata,
            contentAnalysis: post.contentAnalysis             
        });
        post.commentCount++;
        post.totalEngagement += 2; // Assigning a weight of 2 for comments
        postComments[postId].push(postCount);
        posts[postCount] = newcomment;

        User storage engagingUser = users[msg.sender];
        userPosts[msg.sender].push(postCount);
        engagingUser.engagementScore += 5; // assigning a weight of 5 for commenting
        interactWith(postId, InteractionType.Comment, msg.sender);
        
        postCount++;
        return postCount - 1;
    }
    function updateMetadata(uint postId, bytes32[] memory tags, bytes32 category) public {
        require(postId < postCount, "Post does not exist");
        require(msg.sender == posts[postId].creator, "Only the creator can update metadata");
        Post storage post = posts[postId];
        post.metadata = Metadata(tags, category);
    }
    function updateContentAnalysis(uint postId, uint sentimentScore, bytes32 mainTopic) public {
        require(postId < postCount, "Post does not exist");
        require(msg.sender == posts[postId].creator, "Only the creator can update content analysis");
        Post storage post = posts[postId];
        post.contentAnalysis = ContentAnalysis(sentimentScore, mainTopic);
    }
    function getInteractions(uint256[] memory interactionIds) public view returns (Interaction[] memory){
            Interaction[] memory result = new Interaction[](interactionIds.length);
            for(uint i = 0; i < interactionIds.length; i++) {
                result[i] = interactions[interactionIds[i]];
            }
            return result;
    }
    function getInteractionsFromPost(uint256 postId, uint start, uint length) public view returns (Interaction[] memory){
            require(postId < postCount, "Post does not exist");
            require(start < postInteractions[postId].length, "Start index out of bounds");
            require(start + length < postInteractions[postId].length, "End index out of bounds");
            Interaction[] memory result = new Interaction[](length);
            for(uint i = 0; i < length; i++) {
                result[i] = interactions[postInteractions[postId][start + i]];
            }
            return result;
    }
    function getUserInteractions(address user, uint start, uint length) public view returns(Interaction[] memory){
        require(users[user].userAddress != address(0), "User does not exist");
        require(start < userInteractions[user].length, "Start index out of bounds");
        require(start + length < userInteractions[user].length, "End index out of bounds");
        Interaction[] memory result = new Interaction[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = interactions[userInteractions[user][start + i]];
        }
        return result;
    }
    function getPostsWith(uint256[] memory postIds) public view returns (Post[] memory) {
            Post[] memory result = new Post[](postIds.length);
            for(uint i = 0; i < postIds.length; i++) {
                result[i] = posts[postIds[i]];
            }
            return result;
    }    
    function getPosts(uint start, uint length) public view returns (Post[] memory){
        require(start < postCount, "Start index out of bounds");
        require(start + length < postCount, "End index out of bounds");
        Post[] memory result = new Post[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = posts[start + i];
        }
        return result;
    }
    function getPostsFromUser(address user, uint start, uint length) public view returns (Post[] memory){
        require(users[user].userAddress != address(0), "User does not exist");
        require(start < userPosts[user].length, "Start index out of bounds");
        require(start + length < userPosts[user].length, "End index out of bounds");
        Post[] memory result = new Post[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = posts[userPosts[user][start + i]];
        }
        return result;
    }
    // get last n posts from user
    function getLastNPostsFrom(address user, uint n) public view returns (Post[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        uint flength = userPosts[user].length;
        uint gth = n > flength ? flength : n;
        uint startIdx = flength > gth ? flength - n : 0;
        Post[] memory result = new Post[](gth);
        for(uint i = startIdx; i < gth; i++) {
            result[i] = posts[userPosts[user][i]];
        }
        return result;
    }
    // get last post from addresses (users)
    function getLastPostFromAddresses(address[] memory arr) public view returns (Post[] memory){ 
        Post[] memory result = new Post[](arr.length);
        for(uint i = 0; i < arr.length; i++) {
            if(users[arr[i]].userAddress != address(0))
               if(userPosts[arr[i]].length > 0)
                  result[i] = posts[userPosts[arr[i]][userPosts[arr[i]].length - 1]];
        }
        return result;
    }
    function getPostComments(uint postId, uint start, uint length) public view returns (Post[] memory){
        require(postId < postCount, "Post does not exist");
        require(start < postComments[postId].length, "Start index out of bounds");
        require(start + length < postComments[postId].length, "End index out of bounds");
        Post[] memory result = new Post[](length);
        for(uint i = 0; i < length; i++) {
            result[i] = posts[postComments[postId][start + i]];
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
        require(users[user].userAddress != address(0), "User does not exist");
        return getUsers(following[user], start, length);
    }
    function getEngagedWith(address user, uint start, uint length) public view returns (User[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        return getUsers(engagedWith[user], start, length);
    }
    function getLeaderboard(address user) public view returns(uint[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        return users[user].leaderboard;
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
    function getStohasticFollowers(address user, uint topN) public view returns (address[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        return getStohastic(followers[user], topN);
    }
    function getStohasticFollowing(address user, uint topN) public view returns (address[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        return getStohastic(following[user], topN);
    }
    function getStohasticEngagedWith(address user, uint topN) public view returns (address[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        return getStohastic(engagedWith[user], topN);
    }

    function getRecentPostsFrom(address[] memory fromUsers, uint count) public view returns (uint[] memory) {
        uint[] memory recentPosts = new uint[](count);
        uint index = 0;

        for (uint i = 0; i < fromUsers.length; i++) {
            address user = fromUsers[i];
            uint[] storage postsFromFollower = userPosts[user];
            
            for (uint j = postsFromFollower.length > count ? postsFromFollower.length - count : 0; j < postsFromFollower.length; j++) {
                if (index < count) {
                    recentPosts[index] = postsFromFollower[j];
                    index++;
                }
            }
        }
        return recentPosts;
    }

    function generateFeedFromLeaderboard(address user, uint count) public view returns (Post[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        uint[] memory recentPosts = new uint[](count);
        uint index = 0;

        for (uint i = 0; i < users[user].leaderboard.length; i++) {
            if (index < count) {
                recentPosts[index] = users[user].leaderboard[i];
                index++;
            }
        }

        // Fetch the posts
        Post[] memory feed = new Post[](count);
        for (uint i = 0; i < count && i < recentPosts.length; i++) {
            feed[i] = posts[recentPosts[i]];
        }

        return feed;
    }

    function generateFeed(address user, uint count) public view returns (Post[] memory) {
        require(users[user].userAddress != address(0), "User does not exist");
        //uint[] memory recentPosts = getRecentPostsFromFollowers(user, count);
        uint[] memory recentPosts = getRecentPostsFrom(followers[user], count);
        //uint[] memory recentPosts = getRecentPostsFrom(following[user], count);
        //uint[] memory recentPosts = getRecentPostsFrom(engagedWith[user], count);
        
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
    }

    // function getUserFollowersFeed(address user, uint start, uint length) public view returns (Post[] memory) {
    //     require(users[user].userAddress != address(0), "User does not exist");
    //     // This is a simple example where we just concatenate the posts from the followed users.
    //     // In a real-world scenario, you would want to sort these posts based on some kind of relevance algorithm.
    //     User memory fuser = users[user];
    //     Post[] memory feed = new Post[](length);
    //     uint count = 0;
    //     for (uint i = 0; i < fuser.followers.length; i++) {
    //         address followerUser = fuser.followers[i];
    //         uint[] storage postsFromFollowerUser = users[followerUser].posts;
    //         // get last 10 posts from follo

    //         for (uint j = 0; j < postsFromFollowedUser.length && count < length; j++) {
    //             feed[count] = posts[postsFromFollowedUser[j]];
    //             count++;
    //         }
    //     }
    //     return feed;
    // }

    // function getUserFollowingFeed(address user, uint start, uint length) public view returns (Post[] memory) {
    //     require(users[user].userAddress != address(0), "User does not exist");
    //     // This is a simple example where we just concatenate the posts from the followed users.
    //     // In a real-world scenario, you would want to sort these posts based on some kind of relevance algorithm.
    //     User memory fuser = users[user];
    //     Post[] memory feed = new Post[](length);
    //     uint count = 0;
    //     for (uint i = 0; i < fuser.following.length; i++) {
    //         address followedUser = fuser.following[i];
    //         // uint[] storage postsFromFollowedUser = users[followedUser].posts;
    //         uint flength = users[followedUser].posts.length; // post from followed user
    //         // get the last 10 posts from each followed user
    //         uint startIdx = flength > 10 ? flength - 10 : 0;

    //         for (uint j = startIdx; j < flength && count < length; j++) {
    //             feed[count] = posts[postsFromFollowedUser[j]];
    //             count++;
    //         }
    //         // for (uint j = 0; j < postsFromFollowedUser.length && count < length; j++) {
    //         //     feed[count] = posts[postsFromFollowedUser[j]];
    //         //     count++;
    //         // }
    //     }
    //     return feed;
    // }
    /*
    function deleteFollower(address follower) public {
        require(users[follower].userAddress != address(0), "Follower does not exist");
        require(isFollower[msg.sender][follower] != 0, "Follower does not exist");
        delete isFollower[msg.sender][follower];
        delete isFollowing[follower][msg.sender];
        delete followers[msg.sender][isFollower[msg.sender][follower]];
        delete following[follower][isFollowing[follower][msg.sender]];
    }*/ 

    // function getRecentPostsFromFollowers(address user, uint count) public view returns (uint[] memory) {
    //     require(users[user].userAddress != address(0), "User does not exist");
    //     uint[] memory recentPosts = new uint[](count);
    //     uint index = 0;

    //     for (uint i = 0; i < followers[user].length; i++) {
    //         address follower = followers[user][i];
    //         uint[] storage postsFromFollower = userPosts[follower];
            
    //         for (uint j = postsFromFollower.length > count ? postsFromFollower.length - count : 0; j < postsFromFollower.length; j++) {
    //             if (index < count) {
    //                 recentPosts[index] = postsFromFollower[j];
    //                 index++;
    //             }
    //         }
    //     }
    //     return recentPosts;
    // }    

    /*
    function getFollowingLength(address user) public view returns (uint) {
        return following[user].length;
    }
    function getFollowersLength(address user) public view returns (uint) {
        return followers[user].length;
    }
    function getEngagedWithLength(address user) public view returns (uint) {
        return engagedWith[user].length;
    }
    function getUserPostsLength(address user) public view returns (uint) {
        return userPosts[user].length;
    }
    function getUserInteractionsLength(address user) public view returns (uint) {
        return userInteractions[user].length;
    }
    function getPostInteractionsLength(uint postId) public view returns (uint) {
        return postInteractions[postId].length;
    }
    function getPostCommentsLength(uint postId) public view returns (uint) {
        return postComments[postId].length;
    }*/
}