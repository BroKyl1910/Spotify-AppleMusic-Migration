var express = require("express"),
    app = express(),
    SpotifyWebApi = require('spotify-web-api-node'),
    refresh = require('spotify-refresh');


app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("index");
    logInToSpotify();


});


app.listen(8888, function() {
    console.log("Server Started");
});




function logInToSpotify() {
    var scopes = ['user-read-private', 'user-read-email', 'playlist-read-private'],
        redirectUri = 'https://localhost:8888',
        clientId = 'f6c0cae9a5244364853aa409966d4672',
        state = '';

    // Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
    var spotifyApi = new SpotifyWebApi({
        redirectUri: redirectUri,
        clientId: clientId
    });

    // Create the authorization URL
    var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);

    // https://accounts.spotify.com:443/authorize?client_id=5fe01282e44241328a84e7c5cc169165&response_type=code&redirect_uri=https://example.com/callback&scope=user-read-private%20user-read-email&state=some-state-of-my-choice
    // console.log(authorizeURL);

    var accessToken = 'BQBBDxVFsTwzr7LMgOILvjrKnDruWmB2Y6JV8Nbf8RfF08Ls6DAvgYbSbXIWuT5471tMX-umSVISNSuvXSY8fgUoXFb5htMqTyhEkhprp-Dcal1P8Bz3EA6aVh7oy6t9IzaKB7_9GSkbFsNhyz4qJiMyfX4EwCwFaIh5TcPb2BhMDdVK7l8e8w';
    var refreshToken = 'AQASOSwBvJinxxwVB2Frs8jkUxvDH8nJDcg9BUldKCOANBn-QWSQFAs4zV7SCR2yc0EP82BnSZ9ejLIi9vwX0I6VpI757PFO9nIdFLamtTdE7DCpCJEyUzk8gAMlumvRCWU';

    // var clientID = 'f6c0cae9a5244364853aa409966d4672';
    // var clientSecret = '18ed5d3f21684eacbe36b94ca5a1c1cd';

    spotifyApi.setAccessToken(accessToken);
    spotifyApi.setRefreshToken(refreshToken);

    var playlistID;
    var userID;
    spotifyApi.getUserPlaylists(spotifyApi.getMe()).then(
        function(data) {
            var responseBody = data.body;
            console.log("========================================================");
            console.log("Get User Playlists Response: \n"+responseBody.items);
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
                    console.log("Get Playlist Tracks Response: \n" + JSON.stringify(responseBody.items));
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