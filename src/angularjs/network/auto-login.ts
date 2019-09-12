import * as angular from 'angular'
import {PasswordKey, RoomIDKey, UsernameKey} from "../keys/keys";
import {RoomType} from "../keys/room-type";
import {Utils} from "../services/utils";
import {ICredential} from "./credential";
import {IEnvironment} from "../services/environment";
import {IRoomCreator} from "../entities/room";

export interface IAutoLogin {
    getCredentials(): ICredential
    tryToJoinRoom(): void
}

class AutoLogin implements IAutoLogin {

    username = "";
    password = "";
    roomID = "";
    updated = false;

    static $inject = ["$window", "Credential", "RoomCreator", "RoomStore", "Environment"];

    constructor (
        private $window: ng.IWindowService,
        private Credential,
        private RoomCreator: IRoomCreator,
        private RoomStore,
        private Environment: IEnvironment) {
    }

    updateParameters() {
        if (this.updated) {
            return;
        }

        let pairs = this.$window.location.search.replace("?", "").split("&");

        for(let i = 0; i < pairs.length; i++) {
            let values = pairs[i].split("=");
            if(values.length === 2) {
                let key = values[0];
                let value = values[1];

                if (key === UsernameKey) {
                    this.username = value;
                }
                if (key === PasswordKey) {
                    this.password = value;
                }
                if (key === RoomIDKey) {
                    this.roomID = value;
                }
            }
        }

        // If the parameters aren't set, check the config options
        if (this.username === "" && !Utils.unORNull(this.Environment.config().username)) {
            this.username = this.Environment.config().username;
        }
        if (this.password === "" && !Utils.unORNull(this.Environment.config().password)) {
            this.password = this.Environment.config().password;
        }
        if (this.roomID === "" && !Utils.unORNull(this.Environment.config().roomID)) {
            this.roomID = this.Environment.config().roomID;
        }

        this.updated = true;
    }

    autoLoginEnabled() {
        this.updateParameters();
        return this.username !== "" && this.password !== "";
    }

    getCredentials(): ICredential {
        if (this.autoLoginEnabled()) {
            return new this.Credential().emailAndPassword(this.username, this.password);
        } else {
            return null;
        }
    }

    // username=1@d.co&password=123456&roomID=123

    tryToJoinRoom(): void {
        this.updateParameters();
        if (this.roomID !== "") {
            let room = this.RoomStore.getRoomWithID(this.roomID);
            if (Utils.unORNull(room)) {
                this.RoomCreator.createRoomWithRID(this.roomID, this.roomID, "", true, RoomType.Group, true, 0);
            }
        }
    }
}

angular.module('myApp.services').service('AutoLogin', AutoLogin);