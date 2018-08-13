var express = require("express"),
    app = express(),
    SpotifyWebApi = require('spotify-web-api-node'),
    request = require('request'),
    cors = require('cors'),
    cookieParser = require('cookie-parser'),
    queryString = require('querystring'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    FILE_NAME = 'app_data.txt';
    // playlistsScript = require('./public/scripts/playlists.js');


app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("index");
    // logInToSpotify();
});

app.get("/print", function(req, res){
    console.log(readFromFile());
});

app.get("/playlists", function(req,res){
    var accessToken = getFromFile('access_token');
    console.log(accessToken);
    var requestOptions = {
        url: 'https://api.spotify.com/v1/me/playlists',
        headers: {
            'Authorization': 'Bearer '+ accessToken 
        }
    }
    request(requestOptions, function (error, response, body) {
      console.log('body:', body);
      var parsedBody = JSON.parse(body);
      console.log(parsedBody["items"]);
      var items = parsedBody["items"];
      var playlistNames = [];
      var playlistIds = [];
      items.forEach(function(item){
        playlistNames.push(item["name"]);
        playlistIds.push(item["id"]);
      });
      console.log(playlistNames);
      res.render("playlists", {playlistNames: playlistNames, playlistIds: playlistIds});
    });
});

app.get("/:playlistID/tracks", function(req, res){
    var playlistId = req.params.playlistID;
    console.log('Playlist ID: ' +playlistId);
    var accessToken = getFromFile('access_token');
    var userId = getFromFile('user_id');
    var requestOptions = {
        url: 'https://api.spotify.com/v1/users/'+userId+'/playlists/'+playlistId+'/tracks',
        headers: {
            'Authorization': 'Bearer '+ accessToken 
        }
    }
    request(requestOptions, function (error, response, body) {
      console.log('body:', body);
      var parsedBody = JSON.parse(body);
      var items = parsedBody["items"];
      var trackNames = [];
      var trackIds = [];
      var trackArtists = [];
      items.forEach(function(item){
        trackNames.push(item["track"]["name"]);
        trackIds.push(item["track"]["id"]);
        trackArtists.push(item["track"]["artists"][0]["name"]);
      });
      res.send({trackNames: trackNames, trackArtists: trackArtists, trackIds: trackIds});
    });

});

/*
============================================================================================
USER LOGIN
============================================================================================
*/
var client_id = 'f6c0cae9a5244364853aa409966d4672'; // Your client id
var client_secret = '18ed5d3f21684eacbe36b94ca5a1c1cd'; // Your secret
var redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri


var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
var stateKey = 'spotify_auth_state';
app.use(cors())
    .use(cookieParser());


app.get("/login_spotify", function(req, res) {
    console.log("Attempting to log in");

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        queryString.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state,
            show_dialog: true
        }));
});

app.get("/callback", function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state == null || state != storedState) {
        res.redirect('/#' +
            queryString.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                clearFile();
                saveToFile('access_token', access_token);

                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: {
                        'Authorization': 'Bearer ' + access_token
                    },
                    json: true
                };

                // use the access token to access the Spotify Web API
                request.get(options, function(error, response, body) {
                    console.log(body);
                    saveToFile('user_id', body.id);
                });

                console.log("Logged In Successfully");

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    queryString.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    queryString.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});


/*
============================================================================================
END OF USER LOGIN
============================================================================================
*/

function readFromFile(){
    var file = fs.readFileSync(FILE_NAME, 'utf8');
    return file; 
}

function saveToFile(key, value){
    fs.appendFileSync(FILE_NAME, key+','+value+'\n');
}

function getFromFile(key){
    var file = fs.readFileSync(FILE_NAME, 'utf8');
    var lines = file.split('\n');
    var matchedValue = '';
    var found = false;
    lines.forEach(function(line){
        var storedKeyValuePairs = line.split(',');
        var storedKey = storedKeyValuePairs[0];
        var storedValue = storedKeyValuePairs[1];
        if(storedKey==key){
            matchedValue = storedValue;
            found = true;
        }
    });

    if(found){
        console.log('Returning: '+matchedValue);
        return matchedValue;
    }
}

function clearFile(){
    fs.writeFileSync(FILE_NAME, '');
}


app.listen(8888, function() {
    console.log("Server Started");
});




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