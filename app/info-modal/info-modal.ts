import { Component } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import { Page } from "ui/page";
import { Color } from "tns-core-modules/color";
import * as utils from 'utils/utils';
import { DeviceType } from "tns-core-modules/ui/enums";
import { device } from "tns-core-modules/platform";
import { PluginInfo } from "../shared/plugin-info";
import { openUrl } from "tns-core-modules/utils/utils";
import { PluginInfoWrapper } from "../shared/plugin-info-wrapper";

const pageCommon = require("tns-core-modules/ui/page/page-common").PageBase;

@Component({
  moduleId: module.id,
  templateUrl: "./info-modal.html",
  styleUrls: ["./info-modal.css"]
})
export class InfoModalComponent {
  public pluginInfo: PluginInfoWrapper;

  constructor(private params: ModalDialogParams,
              private page: Page) {
    this.pluginInfo = params.context;

    this.page.on("unloaded", () => {
      console.log(">> unloaded event");
      // using the unloaded event to close the modal when there is user interaction
      // e.g. user taps outside the modal page
      this.params.closeCallback();
    });

    if (page.ios && device.deviceType !== DeviceType.Tablet) {
      // iOS by default won't let us have a transparent background on a modal
      // Ugly workaround from: https://github.com/NativeScript/nativescript/issues/2086#issuecomment-221956483
      this.page.backgroundColor = new Color(50, 0, 0, 0);

      (<any>page)._showNativeModalView = function (parent, context, closeCallback, fullscreen) {
        pageCommon.prototype._showNativeModalView.call(this, parent, context, closeCallback, fullscreen);
        let that = this;

        this._modalParent = parent;
        if (!parent.ios.view.window) {
          throw new Error('Parent page is not part of the window hierarchy. ' +
              'Close the current modal page before showing another one!');
        }

        if (fullscreen) {
          this._ios.modalPresentationStyle = 0;
        } else {
          this._ios.modalPresentationStyle = 2;
          this._UIModalPresentationFormSheet = true;
        }

        pageCommon.prototype._raiseShowingModallyEvent.call(this);

        this._ios.providesPresentationContextTransitionStyle = true;
        this._ios.definesPresentationContext = true;
        this._ios.modalPresentationStyle = UIModalPresentationStyle.OverFullScreen;
        this._ios.modalTransitionStyle = UIModalTransitionStyle.CrossDissolve;
        this._ios.view.backgroundColor = UIColor.clearColor;

        parent.ios.presentViewControllerAnimatedCompletion(this._ios, utils.ios.MajorVersion >= 9, function () {
          that._ios.modalPresentationStyle = UIModalPresentationStyle.CurrentContext;
          that._raiseShownModallyEvent(parent, context, closeCallback);
        });
      };
    }
  }

  openPluginUrl(pluginInfo: PluginInfo): void {
    // open in the default browser
    openUrl(pluginInfo.url);
  }

  close() {
    this.params.closeCallback();
  }
}