/* See README.md at the root of this distribution for copyright and
   license information */
/* eslint-env mocha, node */

import { assert } from "chai";
import { setupPlatform, setup$, setupI18n } from "../TestPlatform.js";
import { UserSettingsDialog } from "../../src/browser/UserSettingsDialog.js";

describe("browser/UserSettingsDialog", () => {

  before(
    () => setupPlatform()
    .then(() => setup$())
    .then(() => setupI18n()));

  beforeEach(() => {
    $("head").empty();
    $("body").empty();
  });

  const user_settings =   {
    "language": "en",
    "layout": "default",
    "jqTheme": "vader",
    "turn_alert": false,
    "cheers": false,
    "tile_click": false,
    "warnings": false,
    "one_window": false,
    "notification": false
  };

  it ("dialog", () => {
    const ui = {
      session: { key : "session key" },
      promiseLayouts: () => Promise.resolve(["A", "B"]),
      promiseLocales: () => Promise.resolve(["C", "D"]),
      getSetting: s => user_settings[s]
    };

    return new Promise(resolve => {
      let dlg = new UserSettingsDialog({
        ui: ui,
        onSubmit: (dlg, vals) => {
          this.setSettings(vals)
          .then(() => window.location.reload());
        },
        error: e => assert.fail(e),
        //debug: console.debug,
        onReady: dlg => {
          //console.log($("body").html());
          dlg.$dlg.dialog("close");
        },
        close: resolve
      });
    });
  });
});
