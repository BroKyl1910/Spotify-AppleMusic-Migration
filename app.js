var express = require("express"),
    app = express(),
    SpotifyWebApi = require('spotify-web-api-node'),
    request = require('request'),
    cors = require('cors'),
    cookieParser = require('cookie-parser'),
    queryString = require('querystring'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    SPOTIFY_FILE_NAME = 'spotify_app_data.txt';
    // playlistsScript = require('./public/scripts/playlists.js');


app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", function(req, res) {
    res.render("index");
});

app.get("/spotify/playlists", function(req,res){
    var accessToken = getFromFile(SPOTIFY_FILE_NAME,'access_token');
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
      var playlists = [];
      items.forEach(function(item){
        playlists.push({
            playlistName: item["name"],
            playlistId: item["id"]
        });
      });
      res.render("playlists", {playlists: playlists});
    });
});

app.get("/spotify/:playlistID/tracks", function(req, res){
    var playlistId = req.params.playlistID;
    console.log('Playlist ID: ' +playlistId);
    var accessToken = getFromFile(SPOTIFY_FILE_NAME, 'access_token');
    var userId = getFromFile(SPOTIFY_FILE_NAME, 'user_id');
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
      var tracks=[];
      items.forEach(function(item){
        tracks.push(
            {
                trackName: item["track"]["name"],
                trackId: item["track"]["id"],
                trackArtist: item["track"]["artists"][0]["name"]
            }
        );
      });
      res.send({tracks: tracks});
    });

});


function readFromFile(name){
    var file = fs.readFileSync(name, 'utf8');
    return file; 
}

function saveToFile(name, key, value){
    fs.appendFileSync(name, key+','+value+'\n');
}

function getFromFile(name, key){
    var file = fs.readFileSync(name, 'utf8');
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
function clearFile(name){
    fs.writeFileSync(name, '');
}





/*
============================================================================================
SPOTIFY USER LOGIN
============================================================================================
*/
var spotify_client_id = 'f6c0cae9a5244364853aa409966d4672'; // Your client id
var spotify_client_secret = '18ed5d3f21684eacbe36b94ca5a1c1cd'; // Your secret
var spotify_redirect_uri = 'http://localhost:8888/spotify/callback'; // Your redirect uri


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


app.get("/spotify/login", function(req, res) {
    console.log("Attempting to log in");

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
        queryString.stringify({
            response_type: 'code',
            client_id: spotify_client_id,
            scope: scope,
            redirect_uri: spotify_redirect_uri,
            state: state,
            show_dialog: true
        }));
});

app.get("/spotify/callback", function(req, res) {
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
                redirect_uri: spotify_redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(spotify_client_id + ':' + spotify_client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;

                clearFile(SPOTIFY_FILE_NAME);
                saveToFile(SPOTIFY_FILE_NAME, 'access_token', access_token);

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
                    saveToFile(SPOTIFY_FILE_NAME, 'user_id', body.id);
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
SPOTIFY END OF USER LOGIN
============================================================================================
*/


app.listen(8888, function() {
    console.log("Server Started");
});
