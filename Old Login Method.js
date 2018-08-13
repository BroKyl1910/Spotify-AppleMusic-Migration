function logInToSpotify() {
    // var scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'],
    //     redirectUri = 'https://localhost:8888',
    //     clientId = 'f6c0cae9a5244364853aa409966d4672',
    //     state = '';

    // // Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
    // var spotifyApi = new SpotifyWebApi({
    //     redirectUri: redirectUri,
    //     clientId: clientId
    // });

    // // Create the authorization URL
    // var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    // // https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice
    // // console.log(authorizeURL);

    // var accessToken = 'BQBHWS5Ja1KJEK4tHQFGG69CtyNYMxJj-FsqpPaia9vTUYYeeagQeGXsQVe1xSB1WYZXPEg-Ba4hnUDQi_H3_U9ZFSgnCd5blQ-S9uyFJ0X91SDsopQnVSPB7zaoMbkzq1-a_aQxPdvQMTC9rH98nXIC17qbgTIIc3a8rkpg1NvvQFQSF9fjXA';
    // var refreshToken = 'AQCsQGq92uO56E7naq8Bss2mmmz6T1vLhrGa1gQyzGvbxWCuToecKBufirnsEd4S8XKPN25Arua7sQdyaZhwAHJqqUgCgk8QY4n3rCnQ_pJBlcfArIC26iye6w_ECbFJ7as';

    // // var clientID = 'f6c0cae9a5244364853aa409966d4672';
    // // var clientSecret = '18ed5d3f21684eacbe36b94ca5a1c1cd';

    // spotifyApi.setAccessToken(accessToken);
    // spotifyApi.setRefreshToken(refreshToken);

    var playlistID;
    var userID;
    spotifyApi.getUserPlaylists(spotifyApi.getMe()).then(
        function(data) {
            var responseBody = data.body;
            console.log("========================================================");
            console.log("Get User Playlists Response: \n" + responseBody.items);
            console.log("========================================================");
            playlistID = responseBody.items[0].id;
            userID = responseBody.items[0].owner.display_name;
            // console.log("Playlist ID: " + playlistID);
            // var playlists = responseBody.items;
            // console.log("Playlists");
            // console.log("==============================");
            // for (var i = 0; i < playlists.length; i++) {
            //   console.log(playlists[i].name);
            // };
        },
        function(err) {
            console.error(err);
        }
    ).then(
        function(data) {
            console.log("playlistID: " + playlistID + "\nuserID: " + userID);
            spotifyApi.getPlaylistTracks(userID, playlistID).then(
                function(data) {
                    var responseBody = data.body;
                    console.log("========================================================");
                    // console.log("Get Playlist Tracks Response: \n" + JSON.stringify(responseBody.items));
                    console.log("Get Playlist Tracks Response: \n" + responseBody.items);
                    console.log("========================================================");
                    // var playlists = responseBody.items;
                    // console.log("Playlists");
                    // console.log("==============================");
                    // for (var i = 0; i < playlists.length; i++) {
                    //   console.log(playlists[i].name);
                    // };
                },
                function(err) {
                    console.error(err);
                }

            )
        },
        function(err) {
            console.error(err);
        }
    );
}