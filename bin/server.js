#!/usr/bin/env node

/*Copyright (C) 2019-2023 The Xanado Project https://github.com/cdot/Xanado
License MIT. See README.md at the root of this distribution for full copyright
and license information. Author Crawford Currie http://c-dot.co.uk*/

/**
 * This is the top level invocation for the server
 * only. The actual code is in {@linkcode Server}. Note that paths are relative
 * to the bin directory (where this script lives).
 * @module
 */

import getopt from "posix-getopt";
import { promises as Fs } from "fs";
import path from "path";
import { Server as SocketServer } from "socket.io";
import HTTP from "http";
import HTTPS from "https";
import nodemailer from "nodemailer";
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

import jQuery from "jquery";
global.$ = global.jQuery = jQuery;

import { ServerPlatform } from "../src/server/ServerPlatform.js";
global.Platform = ServerPlatform;
                    
import { Server } from "../src/server/Server.js";
import { Game } from "../src/game/Game.js";

// Default configuration.
const DEFAULT_CONFIG = {
  port: 9093, // random pick
  host: "0.0.0.0", // all interfaces, required for docker to work
  games: path.join(__dirname, "..", "games"),
  maxAge: 14 * 24 * 60 * 60 * 1000, // 2 weeks
  game_defaults: Game.DEFAULTS,
  // Defaults passed to the UI without processing by the server
  user_defaults: {
    notification: false, // notification requires https
    layout: "default",
    jqTheme: "pepper-grinder",
    warnings: true,
    cheers: true,
    tile_click: true,
    one_window: false, // don't open games in the same tab
    turn_alert: true
  }
};

// Populate sparse config structure with defaults from DEFAULT_CONFIG
function addDefaults(config) {
  // Compatibility with < 3.2.0, which only had "defaults"
  if (config.defaults && !config.game_defaults) {
    config.game_defaults = {};
    xfer(DEFAULT_CONFIG.game_defaults, config.defaults, config.game_defaults);
  }
  if (config.defaults && !config.user_defaults) {
    config.user_defaults = {};
    xfer(DEFAULT_CONFIG.user_defaults, config.defaults, config.user_defaults);
  }

  function xfer(fields, from, to) {
    for (const field in fields) {
      if (typeof to[field] === "undefined")
        to[field] = from[field];
      else if (typeof from[field] === "object") {
        if (typeof to[field] !== "object")
          throw Error(typeof to[field]);
        xfer(fields[field], from[field], to[field]);
      }
    }
  }

  xfer(DEFAULT_CONFIG, DEFAULT_CONFIG, config);
  return config;
}

const DESCRIPTION = [
  "USAGE",
  `\tnode ${path.relative(".", process.argv[1])} [options]`,
  "DESCRIPTION",
  "\tRun a XANADO server",
  "OPTIONS",
  "\t-c, --config <file> - Path to config file",
  "\t-h, --html <dir> - load html from the given directory (default is 'dist')",
  "\t-d, --debug <options> - set debug options",
  "\t\tgame - game logic",
  "\t\tserver - server activity",
  "\t\tusers - user management",
  "\t\tall - all the above"
].join("\n");

const go_parser = new getopt.BasicParser(
  "h:(html)d:(debug)c:(config)",
  process.argv);

const options = {};
let option;
while ((option = go_parser.getopt())) {
  switch (option.option) {
  default: console.error(DESCRIPTION); process.exit();
  case 'd': options.debug = option.optarg; break;
  case 'c': options.config = option.optarg ; break;
  case 'h': options.html_dir = option.optarg; break;
  }
}
if (process.argv.length > go_parser.optind()) {
  console.error(`*** Unexpected "${process.argv[go_parser.optind()]}"`);
  console.error(DESCRIPTION);
  process.exit();
}

let p;
if (options.config) {
  p = Fs.readFile(options.config)
  .catch(e => {
    console.error(e);
    console.warn(`Using default configuration`);
    return "{}";
  });
} else {
  p = Fs.readFile(`${__dirname}/../config.json`)
  .catch(e => {
    console.warn(`Using default configuration`);
    return "{}";
  });
}

p.then(json => addDefaults(JSON.parse(json)))

.then(config => {

  // config.debug is a CSV
  config.debug = (options.debug || config.debug) || "";

  // html_dir is a directory name
  config.html_dir = (options.html_dir || config.html_dir) || "dist";

  if (/^(server|all)$/i.test(options.debug))
    console.debug(config);

  if (config.mail) {
    let transport;
    if (config.mail.transport === "mailgun") {
      if (!process.env.MAILGUN_SMTP_SERVER)
        console.error("mailgun configuration requested, but MAILGUN_SMTP_SERVER not defined");
      else {
        if (!config.mail.sender)
          config.mail.sender = `xanado@${process.env.MAILGUN_DOMAIN}`;
        transport = {
          host: process.env.MAILGUN_SMTP_SERVER,
          port: process.env.MAILGUN_SMTP_PORT,
          secure: false,
          auth: {
            user: process.env.MAILGUN_SMTP_LOGIN,
            pass: process.env.MAILGUN_SMTP_PASSWORD
          }
        };
      }
    } else
      // Might be SMTP, might be something else
      transport = config.mail.transport;
    
    if (transport)
      config.mail.transport = nodemailer.createTransport(transport);
  }

  const promises = [];
  if (config.https) {
    promises.push(
      Fs.readFile(config.https.key)
      .then(k => { config.https.key = k; }));
    promises.push(
      Fs.readFile(config.https.cert)
      .then(c => { config.https.cert = c; }));
  }
  return Promise.all(promises)
  .then(() => new Server(config))
  .then(server => {
    const protocol = config.https
          ? HTTPS.Server(config.https, server.express)
          : HTTP.Server(server.express);

    console.log(`Server starting on ${config.host}:${config.port}`);
    protocol.listen(config.port, config.host);

    const io = new SocketServer(protocol);
    // Each time a player connects, the server will receive
    // a 'connection' event.
    io.sockets.on(
      "connection",
      socket => server.attachSocketHandlers(socket));
  });
});

