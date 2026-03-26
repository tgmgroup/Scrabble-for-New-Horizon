## XANADO server configuration
The XANADO server is configured by reading a [JSON](https://en.wikipedia.org/wiki/JSON) file containing
the following fields:

+ `auth` : A structure that gives authentication options.
	+ `session_secret` : Optional secret used to sign session cookies. This lets you keep sessions alive over server restarts. If it is not given a new random string will be generated when the server starts, invalidating all existing sessions.
	+ `db_file` : Optional path to file used to store usernames and passwords, relative to the root directory of the installation. Default is `passwd.json`.
	+ `oauth2` : Structure containing configurations for oauth2 providers. You have to have registered the	application and obtained client id's and secrets from the provider's website. These configurations are passed directly to the [Passport](https://www.passportjs.org/) strategy for the named provider e.g. [passport-google](https://www.npmjs.com/package/passport-google), [passport-facebook](https://www.npmjs.com/package/passport-facebook). All fields must be given.
		+ `google` :
			+ `logo` : logo URL [e.g.](https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9z_hELisAlapwE9LUPh6fcXIfb5vwpbMl4xl9H9TRFPc5NOO8Sb3VSgIBrfRYvW6cUA)
			+ `module`: "passport-google-oauth20"
			+ `clientID` : YOUR CLIENT ID
			+ `clientSecret` : YOUR SECRET
			+ `scope` : `[ "profile", "email" ]`
			+ `callbackURL`: Google requires a fully qualified URL, by their policies e.g. `protocol://YOUR.SERVER/oauth2/callback/google`
	   + `facebook` :
			+ `logo` : logo URL [e.g.](https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg)
			+ `clientID` : YOUR CLIENT ID
			+ `clientSecret` : YOUR SECRET
			+ `profileFields` : `["id", "displayName", "email"]`
			+ `callbackURL`: `"/oauth2/callback/facebook"`. Facebook requires a relative URL. Put an absolute URL in and you will get a blank page and facebook will never redirect.
+ `game_defaults` : A structure containing defaults to apply to new games.
	+ `edition` : The string name of the default edition when creating new games. Game editions can be found in the `editions` directory. Default is `English_Scrabble`.
	+ `dictionary` : The default dictionary when creating new games. Note that the robot player requires a dictionary. Dictionaries can be found in the 'dictionaries' directory. Default is `CSW2019_English`.
    + `timerType` : Type of timer to use. This can be one of `Game timer` to impose a time limit on the entire game, or `Turn timer` to limit a single turn. Default is to have no timer.
		+ `timeAllowed` : Time limit for a move or for the game, in minutes. If `timerType` is `Game timer` defaults to 25 minutes, and to 1 minute for `Turn timer`.
		+ `timePenalty` : Points lost per minute over `timeAllowed`. Only used if `timerType` is `Game timer`. Default is 5 points per minute.
    + `challengePenalty` : The type of penalty to apply for a failed challenge. One of `Miss next turn`, `Lose points`, or `Lose points per word`. Default is `Miss next turn`.
		+ `penaltyPoints` : The score penalty to apply for a failed challenge. Only used if `challengePenalty` is `Lose points` or `Lose points per word`.
    `wordCheck`: `Check words after play` to check plays against the dictionary, `Reject unknown words` to reject plays that are not in the dictionary with no penalty. Default is no check.
    + `predictScore` : true or false. Whether or not to show the predicted score from tiles placed so far. Default is `true`.
    + `minPlayers` Least number of players must have joined before this game can start. Must be at least 2, default is `2`.
    + `maxPlayers` : Most number of players who can join a game. Default is no limit.
    + `allowUndo` : Whether or not to allow players to undo previous moves without penalty. Default is `false`.
    + `allowTakeBack` : Whether or not to allow players to take back their most recent move without penalty, so long as the next player hasn't challenged or played. Default is `true`.
+ `games` : Path to the directory where games files will be stored,
  relative to the root of the installation. Defaults to `games`.
+ `host` : name of server host. Defaults to `0.0.0.0` (all interfaces). Change to `localhost` to bind only the IP address of the host the server is running on.
+ `html_dir`: sets the directory to get top level html files from. Will usually be either `dist` (for distribution) or `html` (for development). Defaults to `dist`.
+ `https` : HTTPS configuration structure. HTTPS is required for notifications to work in the browser and may be important for protecting passwords. See [here](https://linuxize.com/post/creating-a-self-signed-ssl-certificate/) for how to create a self-signed certificate. On Linux: `openssl req -newkey rsa:4096 -x509 -sha256 -days 3650 -nodes -out https.crt -keyout https.key`
	+ `cert` : cert file e.g. `https.cert`
	+ `key` : key file e.g. `https.key`
+ `mail` : Email configuration, required for mailing password resets and invitations.
	+ `host`: mail host
	+ `sender`:  Mail sender name and address e.g. `"XANADO <xanado@example.com>"`
	+ `transport` : Structure that is passed directly to the nodemailer `createTransport` function. Refer to the [nodemailer documentation](https://nodemailer.com/about/). You can also set "transport" to the string "mailgun" to use a [mailgun]( https://www.mailgun.com/) configuration.
+ `maxAge`: maximum age of a game, in milliseconds. Where it has been longer than this since the game was last interacted with, the game will be pruned. If this is missing or <= 0, games never time out.
+ `port` : The port on the server to use. The default 9093 may be used by several
  [other applications](https://www.speedguide.net/port.php?port=9093)
+ `production`: optional boolean, when true the client code generated by `npm run build` will be used. This option can also be passed on the command-line to `bin/server.js`.
+ `user_defaults` : Defaults that control the user's UI.
	+ `notification` : Whether to generate UI notifications. Notifications require HTTPS. Defaults to `false`.
	+ `theme` : Layout theme, must be the name of a file in `css` (no extension). Defaults to `default`.
	+ `jqTheme` : Name of one of the jQuery user interface themes.
	+ `warnings` : Whether to generate warning sounds. Defaults to  `true`.
	+ `cheers` : Whether to generate end of game cheers / groans. Defaults to `true`.
	+ `tile` : Whether to make a click when a tile is placed. Defaults to `true`.
	+ `turn` : Whether to bong when it's your turn. Defaults to `true`.

### Example
Example configuration file, overriding selected fields and giving oauth2, https, and mail configurations.
```
{
 "port": 8192,
 "host": "localhost",
 "game_defaults": {
  "edition": "French_Scrabble",
  "dictionary": "ODS8_French"
 },
 "user_defaults": {
  "jqTheme": "Le Frog",
  "notification": true,
  "theme": "exander77",
  "tile_click": false,
  "cheers": false
 },
 "auth": {
  "session_secret": "my cookie secret",
  "db_file" : "/var/www/xanado/passwd.json",
  "oauth2": {
   "google": {
    "logo": "https://lh3.googleusercontent.com/COxit...vW6cUA",
    "module": "passport-google-oauth20",
    "clientID":"989235985454-b3finaffwontworkg9kbutyoucantry4.apps.googleusercontent.com",
    "clientSecret":"GOSECR-etSoNottell1-d-ngyou45421hjd",
    "scope": [ "profile", "email" ],
    "callbackURL": "https://xanado.net:8192/oauth2/callback/google"
   },
   "facebook": {
    "logo": "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    "clientID":"982404577829836",
    "clientSecret": "7aca8323498cc80f88a642f09075750a",
    "profileFields": ["id", "displayName", "email"],
    "callbackURL": "https://xanado.net:8192/oauth2/callback/facebook"
   }
  }
 },
 "mail": {
  "sender": "Xanado <xanado@xanado.net>",
  "transport": {
   "host": "isp.net"
   "user": "xanado"
  }
 },
 "https": {
  "cert": "https.crt",
  "key": "https.key"
 }
}
```
