const St = imports.gi.St;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Panel = imports.ui.panel;

const Main = imports.ui.main;

PanelMenu.SystemStatusButton.prototype.updateActor = function(_newActor){
	this._iconActor = _newActor;
	this.actor.set_child(this._iconActor);
}

function WorkspaceIndicator() {
    this._init.apply(this, arguments);
}

WorkspaceIndicator.prototype = {
	__proto__: PanelMenu.SystemStatusButton.prototype,
	
	_init: function(){
		//debugging
		Panel.mymenu = this;

		PanelMenu.SystemStatusButton.prototype._init.call(this, 'folder', 'Workspace Indicator');
		
		this.statusLabel = new St.Label({ text: (global.screen.get_active_workspace().index() + 1).toString() });
		this.updateActor(this.statusLabel);

		this.workspacesItems = [];
        this._workspaceSection = new PopupMenu.PopupMenuSection();
        this.menu.addMenuItem(this._workspaceSection);
        global.screen.connect_after('workspace-added', Lang.bind(this,this._createWorkspacesSection));
        global.screen.connect_after('workspace-removed', Lang.bind(this,this._createWorkspacesSection));
        global.screen.connect_after('workspace-switched', Lang.bind(this,this._updateIndicator));
        this._createWorkspacesSection();

		//styling
		this.menu.actor.add_style_class_name('shorter');
		this.menu.actor.remove_style_class_name('popup-menu');
	},
	
	_updateIndicator: function(a, e){
		this.statusLabel.set_text((global.screen.get_active_workspace().index() + 1).toString());
	},
	
    _createWorkspacesSection : function() {
    	this._workspaceSection.removeAll();
        this.workspacesItems = [];
        
		for(let i = 0; i < global.screen.n_workspaces; i++) {
            this.workspacesItems[i] = new PopupMenu.PopupMenuItem((i + 1).toString());
            this._workspaceSection.addMenuItem(this.workspacesItems[i]);
            this.workspacesItems[i].workspaceId = i;
            this.workspacesItems[i].label_actor = this.statusLabel;
            this.workspacesItems[i].connect('activate', function(actor, event) {
                let metaWorkspace = global.screen.get_workspace_by_index(actor.workspaceId);
                metaWorkspace.activate(true);
                actor.label_actor.set_text((global.screen.get_active_workspace().index() + 1).toString());
            });
		}
    },
	
}

function main() {
    Panel.STANDARD_TRAY_ICON_ORDER.unshift('workspace-indicator');
    Panel.STANDARD_TRAY_ICON_SHELL_IMPLEMENTATION['workspace-indicator'] = WorkspaceIndicator;
}
