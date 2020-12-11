sap.ui.define([
    "com/sap/lyrics/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, Fragment) {
    "use strict";

    return Controller.extend("com.sap.lyrics.controller.App", {

        baseUrl: "https://api.lyrics.ovh",

        onInit: function () {

            let viewModel = new JSONModel({
                busy: false,
                showPrev: false,
                showNext: false,
                prev: null,
                next: null
            });

            let selectedSongModel = new JSONModel({
                song: null,
                artist: null,
                lyrics: null
            });

            this.setModel(viewModel, "viewModel");
            this._viewModel = this.getModel("viewModel");

            this.setModel(selectedSongModel, "selectedSongModel");
            this._selectedSongModel = this.getModel("selectedSongModel");

            this._lyricsModel = this.getOwnerComponent().getModel();

            this._tableResults = this.byId("tableSearchResults");
        },

        onExit: function () {
            if (this._lyricsPopover) {
				this._lyricsPopover.destroy();
			}
        },

        onSearch: async function () {
            this._resetInputSearchState();
            let inputSearch = this.byId("inputSearch");
            let searchTerm = inputSearch.getValue();

            if (!searchTerm) {
                MessageToast.show("Please enter a song or an artist...");
                this._setInputSearchErrorState();
                return;
            }

            this._viewModel.setProperty("/busy", true);
            let results = await fetch(`${this.baseUrl}/suggest/${searchTerm}`);
            let data = await results.json();
            this._viewModel.setProperty("/busy", false);

            console.log(data);

            this._lyricsModel.setProperty("/", data);

            data.next ? this._viewModel.setProperty("/showNext", true) : this._viewModel.setProperty("/showNext", false);
            data.prev ? this._viewModel.setProperty("/showPrev", true) : this._viewModel.setProperty("/showPrev", false);

            data.next ? this._viewModel.setProperty("/next", data.next) : null;
            data.prev ? this._viewModel.setProperty("/prev", data.prev) : null;

            this._viewModel.refresh();

        },

        onGetLyrics: async function (oEvent) {

            let src = oEvent.getSource();
            let columnListItem = src.getParent();

            let selectedSong = "";

            if (columnListItem instanceof sap.m.ColumnListItem) {
                selectedSong = columnListItem.getBindingContext().getObject();
            }

            if (!selectedSong) {
                return;
            }

            console.log(selectedSong);

            this._viewModel.setProperty("/busy", true);

            let results = await fetch(`${this.baseUrl}/v1/${selectedSong.artist.name}/${selectedSong.title}`);
            let data = await results.json(); 
            this._viewModel.setProperty("/busy", false);

            this._selectedSongModel.setProperty("/artist", selectedSong.artist.name);
            this._selectedSongModel.setProperty("/song", selectedSong.title);
            this._selectedSongModel.setProperty("/lyrics", data.lyrics);

            console.log(data);

            this.onLyricsPopoverOpen(src);

        },

        onPrev: function () {
            this._getMoreSongs(this._viewModel.getProperty("/prev"));
        },

        onNext: function () {
            this._getMoreSongs(this._viewModel.getProperty("/next"));
        },

        _getMoreSongs: async function (url) {

            let herokuProxy = "https://cors-anywhere.herokuapp.com/";
            
            this._viewModel.setProperty("/busy", true);
            let results = await fetch(herokuProxy + url);
            let data = await results.json();
            this._viewModel.setProperty("/busy", false);

            console.log(data);

            this._lyricsModel.setProperty("/", data);

            data.next ? this._viewModel.setProperty("/showNext", true) : this._viewModel.setProperty("/showNext", false);
            data.prev ? this._viewModel.setProperty("/showPrev", true) : this._viewModel.setProperty("/showPrev", false);

            data.next ? this._viewModel.setProperty("/next", data.next) : null;
            data.prev ? this._viewModel.setProperty("/prev", data.prev) : null;

            this._viewModel.refresh();
        },

        _resetInputSearchState: function () {
            let inputSearch = this.byId("inputSearch");
            inputSearch.setValueState("None");
            inputSearch.setValueStateText("");

        },

        _setInputSearchErrorState: function () {
            let inputSearch = this.byId("inputSearch");
            inputSearch.setValueState("Error");
            inputSearch.setValueStateText("Please enter a song or an artist...");

        },

        onLyricsPopoverOpen: function (src) {
			
			if (!this._lyricsPopover) {
				Fragment.load({
					id: this.getView().getId() + "_lyrics",
					name: "com.sap.lyrics.fragments.LyricsPopover",
					controller: this
				}).then(oPopover => {
					this._lyricsPopover = oPopover;
					this.getView().addDependent(this._lyricsPopover);
					this._lyricsPopover.openBy(src);
				});
			} else {
				this._lyricsPopover.openBy(src);
			}
        },
        
        onLyricsPopoverClose: function () {
            this._lyricsPopover.close();
        }
    });
});
