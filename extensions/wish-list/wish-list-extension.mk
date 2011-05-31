# Change these to modify how installation is performed
topextensiondir = $(datadir)/gnome-shell/extensions
extensionbase = @erick.red.gmail.com

uuid = $(EXTENSION_ID)$(extensionbase)

extensiondir = $(topextensiondir)/$(uuid)

nodist_extension_DATA = lists.json.in $(EXTRA_EXTENSION)

EXTRA_DIST = lists.json.in

lists.json: lists.json.in $(top_builddir)/config.status

CLEANFILES = lists.json
