const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const Lang = imports.lang;
const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const Main = imports.ui.main;

const Gettext = imports.gettext.domain('shell-extensions');
const _ = Gettext.gettext;

PanelMenu.SystemStatusButton.prototype.updateActor = function(_newActor){
	this._iconActor = _newActor;
	this.actor.set_child(this._iconActor);
}

function WorkspaceIndicator() {
	this._init.apply(this, arguments);
}

let PANEL_REACTIVE = 'entire-panel-reactive'
let WIDE_INDICATOR = 'wide-indicator'

WorkspaceIndicator.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,
	
	_init: function(){
		//debugging
		Panel.mymenu = this;
		this._panel = Main.panel;
		this._panelBinding = null;
		this._indicatorBinding = null;

		PanelMenu.SystemStatusButton.prototype._init.call(this, 'folder', 'Workspace Indicator');

		this.boxLayout = new St.BoxLayout();
		this.statusLabel = new St.Label({ text: '', style: 'min-width:1em;' });
		this.prefixText = _("Workspace") + ' ';
		this.prefixLabel = new St.Label({ text: this.prefixText });

		this.boxLayout.add_actor(this.prefixLabel);
		this.boxLayout.add_actor(this.statusLabel);
		this.updateActor(this.boxLayout);

		this.workspacesItems = [];
		this._workspaceSection = new PopupMenu.PopupMenuSection();
		this.menu.addMenuItem(this._workspaceSection);
		global.screen.connect_after('workspace-added', Lang.bind(this,this._createWorkspacesSection));
		global.screen.connect_after('workspace-removed', Lang.bind(this,this._createWorkspacesSection));
		global.screen.connect_after('workspace-switched', Lang.bind(this,this._updateWorkspaceNumber));

		//styling
		this.menu.actor.add_style_class_name('shorter');
		this.menu.actor.remove_style_class_name('popup-menu');

		this._settings = new Gio.Settings({ schema: 'org.gnome.shell.extensions.workspace-indicator' });
		this._settings.connect("changed::" + PANEL_REACTIVE, Lang.bind(this, this._updatePanelBinding));
		this._settings.connect("changed::" + WIDE_INDICATOR, Lang.bind(this, this._updatePrefix));
		
		this._createWorkspacesSection();
		this._updatePanelBinding();
		this._updatePrefix();
		this._updateWorkspaceNumber();
	},

	_updatePanelBinding: function() {
			let panelReactive = this._settings.get_boolean(PANEL_REACTIVE);
			if(panelReactive) {
				if(this._indicatorBinding) {
					this.actor.disconnect(this._indicatorBinding);
					this._indicatorBinding = null;
				}
				this._panel.reactive = true;
				this._panelBinding = this._panel.actor.connect('scroll-event', Lang.bind(this, this._onScrollEvent));
			} else {
				if(this._panelBinding) {
					this._panel.reactive = false;
					this._panel.actor.disconnect(this._panelBinding);
					this._panelBinding = null;
				}
				this._indicatorBinding = this.actor.connect('scroll-event', Lang.bind(this, this._onScrollEvent));
			}
	},
	_updatePrefix: function() {
		this.prefixLabel.visible = this._settings.get_boolean(WIDE_INDICATOR);
	},

	_updateWorkspaceNumber: function() {
		this.statusLabel.set_text(this._labelText());
	},

	_labelText : function(workspaceIndex) {
		if(workspaceIndex == undefined) {
			workspaceIndex = global.screen.get_active_workspace().index();
		}
		return (workspaceIndex + 1).toString();
	},

	_longLabelText: function(workspaceIndex) {
		return this.prefixText + this._labelText(workspaceIndex);
	},
	
	_createWorkspacesSection : function() {
		this._workspaceSection.removeAll();
		this.workspacesItems = [];
		
		let i = 0;
		for(; i < global.screen.n_workspaces; i++) {
			this.workspacesItems[i] = new PopupMenu.PopupMenuItem(this._longLabelText(i));
			this._workspaceSection.addMenuItem(this.workspacesItems[i]);
			this.workspacesItems[i].workspaceId = i;
			this.workspacesItems[i].label_actor = this.statusLabel;
			let self = this;
			this.workspacesItems[i].connect('activate', Lang.bind(this, function(actor, event) {
				this._activate(actor.workspaceId);
			}));
		}
		if(i == 1) {
			this._updateWorkspaceNumber();
		}
	},

	_activate : function (index) {
		let item = this.workspacesItems[index];
		if(!item) return;
		let metaWorkspace = global.screen.get_workspace_by_index(index);
		metaWorkspace.activate(true);
		this._updateWorkspaceNumber();
	},

	_onScrollEvent : function(actor, event) {
		let direction = event.get_scroll_direction();
		let diff = 0;
		if (direction == Clutter.ScrollDirection.DOWN) {
			diff = 1;
		} else if (direction == Clutter.ScrollDirection.UP) {
			diff = -1;
		} else {
			return;
		}

		let newIndex = global.screen.get_active_workspace().index() + diff;
		this._activate(newIndex);
	},
}

function main() {
	Panel.STANDARD_TRAY_ICON_ORDER.unshift('workspace-indicator');
	Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['workspace-indicator'] = WorkspaceIndicator;
}
