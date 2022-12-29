/* See README.md at the root of this distribution for copyright and
   license information */
/* eslint-env node, mocha */
/* global Platform */

import chai from "chai";
import http from "chai-http";
chai.use(http);
import { promises as Fs } from "fs";
import { ServerPlatform } from "../../src/server/ServerPlatform.js";
global.Platform = ServerPlatform;
import tmp from "tmp-promise";
import sparseEqual from "../sparseEqual.js";

import { Server } from "../../src/server/Server.js";
import { UserManager } from "../../src/server/UserManager.js";

/**
 * Basic unit tests for UserManager class. Only tests Xanado logins.
 */
describe("server/UserManager", () => {

  function UNit() {}

  const config = {
    auth: {
      "db_file" : "delayed"
    },
    defaults: {
      edition: "Test",
      dictionary: "Oxford_5000",
      theme: "default"
    }
  };

  beforeEach(
    () => {
      return tmp.dir()
      .then(d => UserManager.SESSIONS_DIR = d.path)
      .then(() => tmp.file())
      .then(o => config.auth.db_file = o.path)
      .then(() => tmp.dir())
      .then(o => config.games = o.path)      
      .then(() => Platform.i18n().load("en-GB"));
    });

  it("/session when not logged in", () => new Promise(resolve => {
    const s = new Server(config);
    chai.request(s.express)
    .get("/session")
    .end((err, res) => {
      assert.equal(res.status, 401);
      chai.assert.deepEqual(res.body, ["Not signed in"]);
      resolve();
    });
  }));

  it("/register - bad username", () => {
    return new Promise(resolve => {
      const s = new Server(config);
      chai.request(s.express)
      .post("/register")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({})
      .end((err, res) => {
        assert.equal(res.status, 403);
        chai.assert.deepEqual(res.body, ["bad-user", null]);
        resolve();
      });
    });
  });

  it("/register - again", () => {
    const details = {
      register_username: "test_user",
      register_password: "test_pass",
      register_email: "test@email.com"
    };

    const server = new Server(config);
    return new Promise(resolve => {
      chai.request(server.express)
      .post("/register")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(details)
      .end((err, res) => {
        assert.equal(res.status, 200);
        sparseEqual(res.body, {
          name: details.register_username,
          provider: "xanado"
        });
        assert(res.body.key.length > 1);
        assert(!res.body.email);
        resolve();
      });
    })
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/register")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(details)
      .end((err, res) => {
        assert.equal(res.status, 403);
        chai.assert.deepEqual(res.body, [
          "already-registered", "test_user"]);
        resolve();
      });
    }));
  });

  // Promise to register user. Resolve to server.
  function register(server, user) {
    return new Promise(resolve => {
      chai.request(server.express)
      .post("/register")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send(user)
      .end((err, res) => {
        assert.equal(res.status, 200);
        sparseEqual(res.body, {
          name: user.register_username,
          provider: "xanado"
        });
        assert(res.body.key.length > 1);
        assert(!res.body.email);
        resolve(server);
      });
    });
  }
  
  // Promise to login user. Resolve to cookie.
  function login(server, user) {
    return new Promise(resolve => {
      chai.request(server.express)
      .post("/login")
      .send(user)
      .end((err, res) => {
        assert.equal(res.status, 200);
        resolve(res.header["set-cookie"]);
      });
    });
  }

  it("/register new username", () => {
    const server = new Server(config);
    return new Promise(resolve => { 
      chai.request(server.express)
      .post("/register")
      .set('content-type', 'application/x-www-form-urlencoded')
      .send({register_username: "test_user"})
      .end((err, res) => {
        assert.equal(res.status, 200);
        sparseEqual(res.body, {
          name: "test_user",
          provider: "xanado"
        });
        assert(res.body.key.length > 1);
        resolve();
      });
    });
  });

  it("login / logout", () => {
    let cookie;
    const server = new Server(config);
    return register(server, {
      register_username: "test_user",
      register_password: "test_pass",
      register_email: "test@email.com"
    })

    // Wrong password
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/login?origin=greatapes")
      .send({
        login_username: "test_user",
        login_password: "wrong_pass"
      })
      .end((err, res) => {
        assert.equal(res.status, 401);
        // NO! chai.assert.deepEqual(res.body, ["Not signed in"]);
        resolve();
      });
    }))

    // Right password
    .then(() => login(server, {
      login_username: "test_user", login_password: "test_pass"
    }))
    .then(c => cookie = c)

    // Logout
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/logout")
      .set('Cookie', cookie)
      .end((err, res) => {
        assert.equal(res.status, 200);
        resolve();
      });
    }))

    // not logged in Logout
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/logout")
      .set('Cookie', cookie)
      .end((err, res) => {
        assert.equal(res.status, 401);
        chai.assert.deepEqual(res.body, ["Not signed in"]);
        resolve();
      });
    }))

    // User with null password
    .then(() => register(server, {
      register_username: "test2_user",
      register_email: "test2@email.com"
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/login")
      .send({
        login_username: "test2_user",
        login_password: "wrong_pass"
      })
      .end((err, res) => {
        assert.equal(res.status, 401);
        // NO! chai.assert.deepEqual(res.body, ["Not signed in"]);
        resolve();
      });
    }))
    .then(() => login(server, { login_username: "test2_user" }));
  });

  it("logged in /session-settings and /session", () => {
    let  cookie;
    const server = new Server(config);
    return register(server, {
      register_username: "test_user",
      register_password: "test_pass",
      register_email: "test@email.com"
    })
    
    .then(() => login(server, {
      login_username: "test_user", login_password: "test_pass"
    }))
    
    .then(c => cookie = c)
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .get("/session")
      .set('Cookie', cookie)
      .end((err, res) => {
        assert.equal(res.status, 200);
        sparseEqual(res.body, {
          name: "test_user",
          provider: "xanado"
        });
        assert(res.body.key.length > 1);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/session-settings")
      .set('Cookie', cookie)
      .send({sausages: "bratwurst"})
      .end((err, res) => {
        assert.equal(res.status, 200);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .get("/session")
      .set('Cookie', cookie)
      .end((err, res) => {
        assert.equal(res.status, 200);
        sparseEqual(res.body, {
          name: "test_user",
          provider: "xanado",
          settings: { sausages: "bratwurst" }
        });
        assert(res.body.key.length > 1);
        resolve(cookie);
      });
    }));
  });
  
  it("logged in /users", () => {
    let cookie;
    const server = new Server(config);
    return register(server, {
      register_username: "test_user",
      register_password: "test_pass",
      register_email: "test@email.com"
    })
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .get("/users")
      .end((err, res) => {
        //console.log(res.body);
        assert.equal(res.status, 401);
        sparseEqual(res.body, [ 'Not signed in']);
        resolve();
      });
    })
          .then(() => login(server, {
            login_username: "test_user", login_password: "test_pass"
          }))
          .then(c => cookie = c)
          .then(() => new Promise(resolve => {
            chai.request(server.express)
            .get("/users")
            .set('Cookie', cookie)
            .end((err, res) => {
              //console.log(res.body);
              assert.equal(res.status, 200);
              sparseEqual(res.body, [{
                name: "test_user"
              }]);
              assert(res.body[0].key.length > 1);
              resolve();
            });
          })));
  });

  it("/reset-password", () => {
    let cookie, token;
    const server = new Server(config);
    // server.mail.transport hasn't been configured yet
    assert(!server.config.mail);
    //server._debug = console.debug;
    server.config.mail = {
      sender: "unit tests",
      transport: {
        sendMail: function(email) {
          //console.log("Email", email);
          assert.equal(email.from, "unit tests");
          assert.equal(email.to, "test@email.com");
          assert.equal(email.subject, "Password reset");
          assert(email.text);
          token = email.text.replace(
            /^.*\/password-reset\/(\w+).*$/, "$1");
          return Promise.resolve();
        }
      }
    };
    return register(server, {
      register_username: "test_user",
      register_password: "test_pass",
      register_email: "test@email.com"
    })
    .then(cookie => new Promise(resolve => {
      chai.request(server.express)
      .post("/reset-password")
      .send({reset_email: "unknown@email.com"})
      .end((err, res) => {
        //console.log(res.body);
        assert.equal(res.status, 403);
        sparseEqual(res.body, [
          "player-unknown",
          "unknown@email.com"
        ]);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/reset-password")
      .send({reset_email: "test@email.com"})
      .end((err, res) => {
        //console.log(res.text, token);
        assert.equal(res.status, 200);
        sparseEqual(res.body, [
          "text-reset-sent",
          "test_user"
        ]);
        assert(token);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .get(`/password-reset/${token}`)
      .end((err, res) => {
        // redirect to /
        assert.equal(res.status, 200);
        //assert(res.header["set-cookie"]);
        // The cookie gets set OK, but not here.
        //console.log(res.text);
        resolve();
      });      
    }));
  });

  it("/change-password", () => {
    let cookie;
    //config.debug = "users";
    const server = new Server(config);
    return register(server, {
      register_username: "test_user",
      register_password: "test_pass",
      register_email: "test@email.com"
    })
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/change-password")
      .send({password: "wtf"})
      .end((err, res) => {
        assert.equal(res.status, 401);
        sparseEqual(res.body, ["Not signed in"]);
        resolve();
      });
    }))
    .then(() => login(server, {
      login_username: "test_user",
      login_password: "test_pass"
    }))
    .then(c => cookie = c)
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/change-password")
      .send({password: "wtf"})
      .set('Cookie', cookie)
      .end((err, res) => {
        assert.equal(res.status, 200);
        sparseEqual(res.body, [
          "pass-changed",
          "test_user"
        ]);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/logout")
      .set('Cookie', cookie)
      .end((err, res) => {
        assert.equal(res.status, 200);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/session")
      .end((err, res) => {
        assert.equal(res.status, 404);
        resolve();
      });
    }))
    .then(() => new Promise(resolve => {
      chai.request(server.express)
      .post("/login")
      .send({
        login_username: "test_user",
        login_password: "test_pass"
      })
      .end((err, res) => {
        assert.equal(res.status, 401);
        // NO! chai.assert.deepEqual(res.body, ["Not signed in"]);
        resolve();
      });
    }));
  });
});
