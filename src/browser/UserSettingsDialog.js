/*Copyright (C) 2019-2022 The Xanado Project https://github.com/cdot/Xanado
  License MIT. See README.md at the root of this distribution for full copyright
  and license information. Author Crawford Currie http://c-dot.co.uk*/

/**
 * Dialog for user settings.
 */
import { Dialog } from "./Dialog.js";

class UserSettingsDialog extends Dialog {

  constructor(options) {
    super("UserSettingsDialog", $.extend({
      title: $.i18n("Options")
    }, options));

    // Known users, got afresh from /users each time the
    // dialog is opened
    this.users = [];
  }

  // @override
  createDialog() {
    return super.createDialog()
    .then(() => {
      const ui = this.options.ui;
      const $layout = this.$dlg.find('[name=layout]');
      //const $jqt = this.$dlg.find("[name=jqTheme]");
      const $locale = this.$dlg.find('[name=language]');

      return Promise.all([
        ui.promiseLayouts()
        .then(layouts => layouts
              .forEach(css => $layout.append(`<option>${css}</option>`))),
        ui.promiseLocales()
        .then(locales => locales
              .filter(d => d !== "qqq")
              .forEach(lan => $locale.append(`<option>${lan}</option>`)))
      ]);
    });
  }

  // @override
  openDialog() {
    return super.openDialog()
    .then(() => {
      const ui = this.options.ui;

      this.$dlg.find("select[name=language]")
      .val(ui.getSetting("language"))
      .selectmenu("refresh");

      this.$dlg.find("select[name=layout]")
      .val(ui.getSetting("layout"))
      .selectmenu("refresh");

      this.$dlg.find("select[name=jqTheme]")
      .val(ui.getSetting("jqTheme"))
      .selectmenu("refresh");

      this.$dlg.find('input[type=checkbox]')
      .each(function() {
        $(this).prop("checked", ui.getSetting(this.name) === "true")
        .checkboxradio("refresh");
      });
      // Notification requires https
      this.$dlg.find(".require-https").toggle(ui.usingHttps === true);
    });
  }
}

export { UserSettingsDialog }
